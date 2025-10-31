/**
 * Background Service Worker
 * Handles Chrome extension background tasks
 */

// Import AI utilities
import { summarizeText } from '../utils/summarize.js';

// Configuration constants
const MAX_READINGS = 50; // Limit readings to prevent storage quota issues (Chrome has 10MB limit)

// Installation and updates
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Rami installed');

        // Set default preferences
        chrome.storage.local.set({
            preferences: {
                persona: 'strategist',
                theme: 'light',
                mindmapMode: 'reactflow',
                autoSummarize: true,
            },
            readings: [],
            highlights: [],
        });

        // Open welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('dashboard.html'),
        });
    }

    // Create context menu items
    chrome.contextMenus.create({
        id: 'save-reading',
        title: 'Save to Rami',
        contexts: ['page'],
    });

    chrome.contextMenus.create({
        id: 'summarize-selection',
        title: 'Summarize Selection',
        contexts: ['selection'],
    });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    switch (info.menuItemId) {
        case 'save-reading':
            await saveCurrentPage(tab);
            break;

        case 'summarize-selection':
            await summarizeSelection(info, tab);
            break;
    }
});

// Message handler for communication between components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            switch (request.action) {
                case 'save-reading':
                    const result = await saveReading(request.data);
                    sendResponse({ success: true, data: result });
                    break;

                case 'summarize':
                    console.log('📨 Background: Received summarize request');
                    const summary = await performSummarization(request.text, request.options);
                    console.log('📤 Background: Sending response with summary length:', summary?.length);
                    sendResponse({ success: true, data: summary });
                    break;

                case 'check-ai-availability':
                    const availability = await checkAIStatus();
                    sendResponse({ success: true, data: availability });
                    break;

                case 'open-dashboard':
                    const tabParam = request.tab ? `#${request.tab}` : '';
                    await chrome.tabs.create({
                        url: chrome.runtime.getURL('dashboard.html') + tabParam,
                    });
                    sendResponse({ success: true });
                    break;

                case 'save-highlight':
                    const highlightResult = await saveHighlight(request.data);
                    sendResponse(highlightResult);
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    // Keep message channel open for async response
    return true;
});

/**
 * Save current page as a reading
 */
async function saveCurrentPage(tab) {
    try {
        // Inject content script if needed
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['src/content/reader.js'],
        });

        // Get page content
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: extractPageContent,
        });

        const extractedData = result.result;

        const reading = {
            id: Date.now().toString(),
            title: extractedData.title || tab.title, // Prefer extracted title
            url: tab.url,
            content: extractedData.content,
            excerpt: extractedData.excerpt,
            timestamp: new Date().toISOString(),
        };

        // Save to storage with size limit
        const { readings = [] } = await chrome.storage.local.get('readings');
        readings.unshift(reading);

        // Enforce size limit to prevent storage quota issues
        if (readings.length > MAX_READINGS) {
            const removed = readings.splice(MAX_READINGS);
            console.log(`⚠️ Removed ${removed.length} old readings (limit: ${MAX_READINGS})`);
        }

        await chrome.storage.local.set({ readings });

        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Reading Saved',
            message: `"${tab.title}" has been saved to Rami`,
        });

        return reading;
    } catch (error) {
        console.error('Failed to save reading:', error);
        throw error;
    }
}

/**
 * Save a reading from provided data
 */
async function saveReading(data) {
    const reading = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...data,
    };

    const { readings = [] } = await chrome.storage.local.get('readings');
    readings.unshift(reading);

    // Enforce size limit
    if (readings.length > MAX_READINGS) {
        const removed = readings.splice(MAX_READINGS);
        console.log(`⚠️ Removed ${removed.length} old readings (limit: ${MAX_READINGS})`);
    }

    await chrome.storage.local.set({ readings });

    return reading;
}

/**
 * Summarize selected text
 */
async function summarizeSelection(info, tab) {
    try {
        // Get user preferences
        const { preferences } = await chrome.storage.local.get('preferences');
        const persona = preferences?.persona || 'strategist';

        // Perform summarization (mock for now)
        const summary = await performSummarization(info.selectionText, { persona });

        // Show in notification or popup
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Summary Ready',
            message: summary.substring(0, 100) + '...',
        });

        // Could also open side panel or popup with full summary
    } catch (error) {
        console.error('Failed to summarize:', error);
    }
}

/**
 * Check AI availability
 */
async function checkAIStatus() {
    try {
        if (!('ai' in chrome)) {
            return { available: false, reason: 'Chrome AI not available' };
        }

        return {
            available: true,
            features: {
                languageModel: true,
                summarizer: true,
            },
        };
    } catch (error) {
        return { available: false, reason: error.message };
    }
}

/**
 * Perform summarization using AI
 */
async function performSummarization(text, options = {}) {
    console.log('🎯 Background: performSummarization called with', text.length, 'characters');

    try {
        // Get user preferences for persona
        const { preferences } = await chrome.storage.local.get('preferences');
        const persona = options.persona || preferences?.persona || 'strategist';

        console.log('📝 Background: Calling summarizeText with persona:', persona);

        // Check if summarizeText is available
        if (typeof summarizeText !== 'function') {
            throw new Error('summarizeText function not available - import may have failed');
        }

        const result = await summarizeText(text, {
            persona,
            length: options.length || 'medium',
        });

        console.log('📊 Background: summarizeText returned:', {
            success: result.success,
            summaryLength: result.summary?.length,
            method: result.method,
        });

        if (result.success && result.summary) {
            console.log('✅ Background: AI summary generated successfully');
            return result.summary;
        } else {
            console.warn('⚠️ Background: AI summarization failed, using fallback');
            // Fallback: return first few sentences
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
            return sentences.slice(0, 3).join(' ');
        }
    } catch (error) {
        console.error('❌ Background: Summarization error:', error);
        console.error('Error stack:', error.stack);
        // Fallback: return first few sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.slice(0, 3).join(' ');
    }
}

/**
 * Helper function to extract page content (runs in page context)
 * Intelligently extracts article content while filtering out navigation, headers, and ads
 */
function extractPageContent() {
    // Try multiple selectors for article content
    let article = null;

    // Try common article selectors in order of specificity
    const articleSelectors = [
        'article[role="main"]',
        'article',
        '[role="main"]',
        'main article',
        'main',
        '.article-content',
        '.post-content',
        '.entry-content',
        '#content article',
        '#main-content',
        '.content-area'
    ];

    for (const selector of articleSelectors) {
        article = document.querySelector(selector);
        if (article) {
            console.log('✅ Found article using selector:', selector);
            break;
        }
    }

    // Fallback to body if no article found
    if (!article) {
        console.warn('⚠️ No article element found, using body');
        article = document.body;
    }

    // Clone the article to avoid modifying the page
    const articleClone = article.cloneNode(true);

    // Remove unwanted elements that might contaminate the content
    const unwantedSelectors = [
        'nav', 'header', 'footer', 'aside',
        '.navigation', '.nav', '.menu', '.sidebar',
        '.advertisement', '.ad', '.ads', '.promo',
        '.social-share', '.share-buttons',
        '.comments', '.comment-section',
        '.related-posts', '.recommended',
        'script', 'style', 'iframe',
        '.breadcrumb', '.breadcrumbs',
        '[role="navigation"]', '[role="complementary"]',
        '.header', '.site-header', '.page-header'
    ];

    unwantedSelectors.forEach(selector => {
        const elements = articleClone.querySelectorAll(selector);
        elements.forEach(el => el.remove());
    });

    // Get clean text content
    let content = articleClone.innerText || articleClone.textContent || '';

    // Clean up the content
    content = content
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
        .replace(/[ \t]+/g, ' ') // Normalize spaces
        .trim();

    // Try to find the main heading/title from the article
    const titleElement = article.querySelector('h1') || document.querySelector('h1');
    const title = titleElement ? titleElement.textContent.trim() : '';

    // Create excerpt from first paragraph or beginning of content
    const firstParagraph = article.querySelector('p');
    let excerpt = '';
    if (firstParagraph) {
        excerpt = firstParagraph.textContent.trim().substring(0, 300);
    } else {
        excerpt = content.substring(0, 300);
    }

    console.log('📄 Extracted content length:', content.length, 'characters');
    console.log('📝 Title:', title);
    console.log('📋 Excerpt:', excerpt.substring(0, 100) + '...');

    return {
        content,
        excerpt,
        title: title || document.title
    };
}

/**
 * Save a highlight
 */
async function saveHighlight(data) {
    try {
        const highlight = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            color: 'yellow',
            ...data,
        };

        const { highlights = [] } = await chrome.storage.local.get('highlights');
        highlights.push(highlight);
        await chrome.storage.local.set({ highlights });

        return { success: true, data: highlight };
    } catch (error) {
        console.error('Failed to save highlight:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Helper function to add highlight to page (runs in page context)
 */
function addHighlightToPage(text) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'reading-highlight';
    span.style.backgroundColor = 'rgba(255, 235, 59, 0.4)';

    try {
        range.surroundContents(span);
    } catch (e) {
        console.error('Failed to add highlight:', e);
    }
}