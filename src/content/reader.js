/**
 * Content Script for Reader Mode
 * Injects reading enhancements into web pages
 * FIXED: Theme support for dialogs and notifications
 */

(function() {
    'use strict';

    // Avoid multiple injections
    if (window.aiReadingStudioInjected) return;
    window.aiReadingStudioInjected = true;

    console.log('Rami: Content script loaded');

    // State
    let isReaderMode = false;
    let originalContent = null;
    let isInitialized = false;

    /**
     * Initialize content script
     */
    function initialize() {
        // Prevent double initialization
        if (isInitialized) return;
        isInitialized = true;

        // Listen for messages from extension
        chrome.runtime.onMessage.addListener(handleMessage);

        // Add keyboard shortcuts
        document.addEventListener('keydown', handleKeyboard);

        // Add selection handler for quick actions
        document.addEventListener('mouseup', handleSelection);

        // Create floating toolbar
        createFloatingToolbar();

        // Clean up on page unload to prevent memory leaks
        window.addEventListener('beforeunload', cleanup);
    }

    /**
     * Cleanup function to remove event listeners
     */
    function cleanup() {
        console.log('Rami: Cleaning up content script');

        // Remove event listeners
        document.removeEventListener('keydown', handleKeyboard);
        document.removeEventListener('mouseup', handleSelection);
        chrome.runtime.onMessage.removeListener(handleMessage);

        // Remove toolbar if exists
        const toolbar = document.getElementById('ai-reading-studio-toolbar');
        if (toolbar) {
            toolbar.remove();
        }

        // Reset state
        isInitialized = false;
        isReaderMode = false;
        originalContent = null;
    }

    /**
     * Handle messages from background script or popup
     */
    function handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'toggle-reader-mode':
                toggleReaderMode();
                sendResponse({ success: true, active: isReaderMode });
                break;

            case 'extract-content':
                const content = extractMainContent();
                sendResponse({ success: true, content });
                break;

            case 'highlight-text':
                highlightText(request.text, request.color);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }

        return true;
    }

    /**
     * Handle keyboard shortcuts
     */
    function handleKeyboard(event) {
        // Alt+R: Toggle reader mode
        if (event.altKey && event.key === 'r') {
            event.preventDefault();
            toggleReaderMode();
        }

        // Alt+H: Highlight selection
        if (event.altKey && event.key === 'h') {
            event.preventDefault();
            highlightCurrentSelection();
        }

        // Alt+S: Summarize selection
        if (event.altKey && event.key === 's') {
            event.preventDefault();
            summarizeCurrentSelection();
        }
    }

    /**
     * Handle text selection
     */
    function handleSelection(event) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 10) {
            showSelectionMenu(event.clientX, event.clientY, selectedText);
        } else {
            hideSelectionMenu();
        }
    }

    /**
     * Toggle reader mode
     */
    function toggleReaderMode() {
        if (isReaderMode) {
            exitReaderMode();
        } else {
            enterReaderMode();
        }
    }

    /**
     * Enter reader mode
     */
    function enterReaderMode() {
        // Extract main content
        const article = extractMainContent();

        // Save original content
        originalContent = document.body.innerHTML;

        // Create reader view
        const readerHTML = `
      <div id="ai-reading-studio-reader" class="reader-container">
        <div class="reader-header">
          <button id="exit-reader" class="reader-btn">Exit Reader Mode</button>
          <div class="reader-controls">
            <button id="decrease-font" class="reader-btn">A-</button>
            <button id="increase-font" class="reader-btn">A+</button>
            <button id="toggle-theme" class="reader-btn">🌙</button>
          </div>
        </div>
        <article class="reader-content">
          <h1>${article.title}</h1>
          <div class="reader-meta">${article.author || ''} • ${article.date || ''}</div>
          <div class="reader-text">${article.content}</div>
        </article>
      </div>
    `;

        document.body.innerHTML = readerHTML;
        isReaderMode = true;

        // Attach event listeners
        document.getElementById('exit-reader').addEventListener('click', exitReaderMode);
        document.getElementById('increase-font').addEventListener('click', () => adjustFontSize(2));
        document.getElementById('decrease-font').addEventListener('click', () => adjustFontSize(-2));
        document.getElementById('toggle-theme').addEventListener('click', toggleReaderTheme);
    }

    /**
     * Exit reader mode
     */
    function exitReaderMode() {
        if (originalContent) {
            document.body.innerHTML = originalContent;
            originalContent = null;
        }
        isReaderMode = false;
    }

    /**
     * Extract main content from page
     */
    function extractMainContent() {
        // Try to find article or main content
        let contentElement = document.querySelector('article');

        if (!contentElement) {
            // Try common content selectors
            const selectors = [
                'main',
                '[role="main"]',
                '.article',
                '.post',
                '.content',
                '#content',
            ];

            for (const selector of selectors) {
                contentElement = document.querySelector(selector);
                if (contentElement) break;
            }
        }

        if (!contentElement) {
            contentElement = document.body;
        }

        // Extract title
        let title = document.querySelector('h1')?.textContent || document.title;

        // Extract author and date (common patterns)
        let author = document.querySelector('[rel="author"]')?.textContent ||
            document.querySelector('.author')?.textContent || '';

        let date = document.querySelector('time')?.getAttribute('datetime') ||
            document.querySelector('.date')?.textContent || '';

        // Clean up content
        const clonedContent = contentElement.cloneNode(true);

        // Remove unwanted elements
        const unwantedSelectors = [
            'script', 'style', 'iframe', 'nav', 'aside',
            '.ads', '.advertisement', '.social-share', '.comments'
        ];

        unwantedSelectors.forEach(selector => {
            clonedContent.querySelectorAll(selector).forEach(el => el.remove());
        });

        return {
            title: title.trim(),
            author: author.trim(),
            date: date.trim(),
            content: clonedContent.innerHTML,
            text: clonedContent.innerText,
        };
    }

    /**
     * Highlight text on page
     */
    function highlightText(text, color = 'yellow') {
        const selection = window.getSelection();

        if (selection.rangeCount === 0) {
            // Search for text in document
            findAndHighlight(text, color);
        } else {
            // Highlight current selection
            highlightRange(selection.getRangeAt(0), color);
        }
    }

    /**
     * Highlight current selection
     */
    function highlightCurrentSelection() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        highlightRange(range, 'yellow');

        // Save to storage
        chrome.runtime.sendMessage({
            action: 'save-highlight',
            data: {
                text: selection.toString(),
                url: window.location.href,
                color: 'yellow',
            },
        });
    }

    /**
     * Highlight a range
     */
    function highlightRange(range, color) {
        const span = document.createElement('span');
        span.className = 'ai-reading-highlight';
        span.style.backgroundColor = getHighlightColor(color);
        span.style.cursor = 'pointer';

        // Add click handler to remove highlight
        span.addEventListener('click', function() {
            const parent = this.parentNode;
            while (this.firstChild) {
                parent.insertBefore(this.firstChild, this);
            }
            parent.removeChild(this);
        });

        try {
            range.surroundContents(span);
        } catch (e) {
            // If surrounding fails, try alternative approach
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);

            // Clean up any empty highlights
            document.querySelectorAll('.ai-reading-highlight').forEach(highlight => {
                if (!highlight.textContent.trim()) {
                    const parent = highlight.parentNode;
                    parent.removeChild(span);
                }
            });
        }
    }

    /**
     * Find and highlight text
     */
    function findAndHighlight(text, color) {
        // Simple implementation - could be improved with better text search
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        while ((node = walker.nextNode())) {
            const index = node.textContent.indexOf(text);
            if (index !== -1) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + text.length);
                highlightRange(range, color);
                break;
            }
        }
    }

    /**
     * Get highlight color
     */
    function getHighlightColor(color) {
        const colors = {
            yellow: 'rgba(255, 235, 59, 0.4)',
            green: 'rgba(76, 175, 80, 0.4)',
            blue: 'rgba(33, 150, 243, 0.4)',
            purple: 'rgba(156, 39, 176, 0.4)',
        };
        return colors[color] || colors.yellow;
    }

    /**
     * FIXED: Summarize current selection with theme-aware notifications
     */
    async function summarizeCurrentSelection() {
        const selection = window.getSelection();
        const text = selection.toString().trim();

        if (text.length < 50) {
            alert('Please select more text to summarize (at least 50 characters)');
            return;
        }

        // Show loading indicator (now awaits to ensure theme is applied)
        const loadingNotif = await showNotification('🤖 Generating AI summary... This may take up to 2 minutes.', 'info', 120000);

        try {
            console.log('📝 Requesting AI summary for', text.length, 'characters');

            // Add timeout wrapper (2 minutes)
            const response = await Promise.race([
                chrome.runtime.sendMessage({
                    action: 'summarize',
                    text: text,
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Summarization timeout after 2 minutes')), 120000)
                )
            ]);

            console.log('📊 Summarization response:', response);

            // Hide loading notification
            if (loadingNotif && loadingNotif.remove) {
                loadingNotif.remove();
            }

            if (response && response.success && response.data) {
                await showSummaryDialog(response.data);
                await showNotification('✅ Summary generated!', 'success');
            } else {
                console.error('❌ Summarization failed:', response);
                await showNotification('Summarization failed. Check console for details.', 'error');
            }
        } catch (error) {
            console.error('💥 Summarization error:', error);

            // Hide loading notification
            if (loadingNotif && loadingNotif.remove) {
                loadingNotif.remove();
            }

            if (error.message.includes('timeout')) {
                await showNotification('⏱️ Summarization timed out. Try selecting less text.', 'error', 5000);
            } else {
                await showNotification('Error: ' + error.message, 'error', 5000);
            }
        }
    }

    /**
     * Convert Markdown to HTML
     */
    function convertMarkdownToHTML(markdown) {
        if (!markdown) return '';

        let html = markdown;

        // Convert bullet points (* text) to list items
        const bulletLines = html.split(/\n/).map(line => line.trim()).filter(line => line);
        const hasBullets = bulletLines.some(line => line.startsWith('* '));

        if (hasBullets) {
            const listItems = bulletLines
                .map(line => {
                    if (line.startsWith('* ')) {
                        return `<li>${line.substring(2).trim()}</li>`;
                    }
                    return line;
                })
                .join('');
            html = `<ul>${listItems}</ul>`;
        }

        // Convert **bold** to <strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Convert *italic* to <em>
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Convert line breaks (if not already in list)
        if (!hasBullets) {
            html = html.replace(/\n/g, '<br>');
        }

        return html;
    }

    /**
     * FIXED: Show summary dialog with theme support
     */
    async function showSummaryDialog(summary) {
        // Get user's theme preference
        let isDarkMode = false;

        try {
            const result = await chrome.storage.local.get('preferences');
            const theme = result.preferences?.theme || 'light';

            // Check if dark mode should be applied
            if (theme === 'dark') {
                isDarkMode = true;
            } else if (theme === 'system') {
                // Check system preference
                isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
        } catch (error) {
            console.error('Failed to get theme preference:', error);
        }

        const dialog = document.createElement('div');
        dialog.className = 'ai-reading-summary-dialog';

        // Convert Markdown to HTML
        const htmlSummary = convertMarkdownToHTML(summary);

        dialog.innerHTML = `
      <div class="dialog-content ${isDarkMode ? 'dark' : ''}">
        <div class="dialog-header">
          <h3>AI Summary</h3>
          <button class="dialog-close">&times;</button>
        </div>
        <div class="dialog-body">
          <div class="summary-content">${htmlSummary}</div>
        </div>
      </div>
    `;

        document.body.appendChild(dialog);

        dialog.querySelector('.dialog-close').addEventListener('click', () => {
            dialog.remove();
        });

        // Close on outside click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    /**
     * Show floating toolbar
     */
    function createFloatingToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'ai-reading-toolbar';
        toolbar.className = 'ai-reading-toolbar hidden';
        toolbar.innerHTML = `
      <button data-action="highlight" title="Highlight (Alt+H)">✏️</button>
      <button data-action="summarize" title="Summarize (Alt+S)">📝</button>
    `;

        document.body.appendChild(toolbar);

        // Attach event listeners
        toolbar.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                handleToolbarAction(action);
            });
        });
    }

    /**
     * Show selection menu
     */
    function showSelectionMenu(x, y, text) {
        let toolbar = document.getElementById('ai-reading-toolbar');
        if (!toolbar) return;

        toolbar.style.left = `${x}px`;
        toolbar.style.top = `${y - 50}px`;
        toolbar.classList.remove('hidden');
    }

    /**
     * Hide selection menu
     */
    function hideSelectionMenu() {
        const toolbar = document.getElementById('ai-reading-toolbar');
        if (toolbar) {
            toolbar.classList.add('hidden');
        }
    }

    /**
     * Handle toolbar actions
     */
    function handleToolbarAction(action) {
        switch (action) {
            case 'highlight':
                highlightCurrentSelection();
                break;
            case 'summarize':
                summarizeCurrentSelection();
                break;
        }

        hideSelectionMenu();
    }

    /**
     * FIXED: Show notification with theme support
     */
    async function showNotification(message, type = 'info', duration = 3000) {
        // Get user's theme preference
        let isDarkMode = false;

        try {
            const result = await chrome.storage.local.get('preferences');
            const theme = result.preferences?.theme || 'light';

            // Check if dark mode should be applied
            if (theme === 'dark') {
                isDarkMode = true;
            } else if (theme === 'system') {
                // Check system preference
                isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
        } catch (error) {
            console.error('Failed to get theme preference:', error);
        }

        const notification = document.createElement('div');
        notification.className = `ai-reading-notification ${type} ${isDarkMode ? 'dark' : ''}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto-hide after duration (unless duration is very long, indicating manual control)
        if (duration < 100000) {
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }

        // Return the notification element so it can be manually removed
        return notification;
    }

    /**
     * Adjust font size
     */
    function adjustFontSize(delta) {
        const content = document.querySelector('.reader-text');
        if (!content) return;

        const currentSize = parseInt(window.getComputedStyle(content).fontSize);
        content.style.fontSize = `${currentSize + delta}px`;
    }

    /**
     * Toggle reader theme
     */
    function toggleReaderTheme() {
        const reader = document.getElementById('ai-reading-studio-reader');
        if (!reader) return;

        reader.classList.toggle('dark');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();