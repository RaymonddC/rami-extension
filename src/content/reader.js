/**
 * Content Script for Reader Mode
 * Injects reading enhancements into web pages
 */

(function () {
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
      case 'extract-content':
        const content = extractMainContent();
        sendResponse({ success: true, content });
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
   * Extract main content from page
   */
  function extractMainContent() {
    // Try to find article or main content
    let contentElement = document.querySelector('article');

    if (!contentElement) {
      // Try common content selectors
      const selectors = ['main', '[role="main"]', '.article', '.post', '.content', '#content'];

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
    let author = document.querySelector('[rel="author"]')?.textContent || document.querySelector('.author')?.textContent || '';

    let date = document.querySelector('time')?.getAttribute('datetime') || document.querySelector('.date')?.textContent || '';

    // Clean up content
    const clonedContent = contentElement.cloneNode(true);

    // Remove unwanted elements
    const unwantedSelectors = ['script', 'style', 'iframe', 'nav', 'aside', '.ads', '.advertisement', '.social-share', '.comments'];

    unwantedSelectors.forEach((selector) => {
      clonedContent.querySelectorAll(selector).forEach((el) => el.remove());
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
   * Summarize current selection
   */
  async function summarizeCurrentSelection() {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length < 50) {
      alert('Please select more text to summarize (at least 50 characters)');
      return;
    }

    // Show loading indicator
    const loadingNotif = showNotification('🤖 Generating AI summary... This may take up to 2 minutes.', 'info', 120000);

    try {
      console.log('📝 Requesting AI summary for', text.length, 'characters');

      // Add timeout wrapper (2 minutes)
      const response = await Promise.race([
        chrome.runtime.sendMessage({
          action: 'summarize',
          text: text,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Summarization timeout after 2 minutes')), 120000)),
      ]);

      console.log('📊 Summarization response:', response);

      // Hide loading notification
      if (loadingNotif && loadingNotif.remove) {
        loadingNotif.remove();
      }

      if (response && response.success && response.data) {
        showSummaryDialog(response.data);
        showNotification('✅ Summary generated!', 'success');
      } else {
        console.error('❌ Summarization failed:', response);
        showNotification('Summarization failed. Check console for details.', 'error');
      }
    } catch (error) {
      console.error('💥 Summarization error:', error);

      // Hide loading notification
      if (loadingNotif && loadingNotif.remove) {
        loadingNotif.remove();
      }

      if (error.message.includes('timeout')) {
        showNotification('⏱️ Summarization timed out. Try selecting less text.', 'error', 5000);
      } else {
        showNotification('Error: ' + error.message, 'error', 5000);
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
    const bulletLines = html
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line);
    const hasBullets = bulletLines.some((line) => line.startsWith('* '));

    if (hasBullets) {
      const listItems = bulletLines
        .map((line) => {
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
   * Show summary dialog
   */
  function showSummaryDialog(summary) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-reading-summary-dialog';

    // Convert Markdown to HTML
    const htmlSummary = convertMarkdownToHTML(summary);

    dialog.innerHTML = `
      <div class="dialog-content">
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
      <button data-action="summarize" title="Summarize (Alt+S)">📝</button>
    `;

    document.body.appendChild(toolbar);

    // Attach event listeners
    toolbar.querySelectorAll('button').forEach((btn) => {
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
      case 'summarize':
        summarizeCurrentSelection();
        break;
    }

    hideSelectionMenu();
  }

  /**
   * Show notification
   */
  function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `ai-reading-notification ${type}`;
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
