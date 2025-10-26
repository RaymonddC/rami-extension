/**
 * Background Service Worker
 * Handles Chrome extension background tasks
 */

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
    id: 'highlight-text',
    title: 'Highlight and Analyze',
    contexts: ['selection'],
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

    case 'highlight-text':
      await highlightSelection(info, tab);
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
          const summary = await performSummarization(request.text, request.options);
          sendResponse({ success: true, data: summary });
          break;

        case 'extract-concepts':
          const concepts = await extractConcepts(request.text, request.options);
          sendResponse({ success: true, data: concepts });
          break;

        case 'check-ai-availability':
          const availability = await checkAIStatus();
          sendResponse({ success: true, data: availability });
          break;

        case 'generate-mindmap':
          const mindmapResult = await generateMindmap(request.data);
          sendResponse(mindmapResult);
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

    const reading = {
      id: Date.now().toString(),
      title: tab.title,
      url: tab.url,
      content: result.result.content,
      excerpt: result.result.excerpt,
      timestamp: new Date().toISOString(),
    };

    // Save to storage
    const { readings = [] } = await chrome.storage.local.get('readings');
    readings.unshift(reading);
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
  await chrome.storage.local.set({ readings });

  return reading;
}

/**
 * Highlight selected text
 */
async function highlightSelection(info, tab) {
  try {
    const highlight = {
      id: Date.now().toString(),
      text: info.selectionText,
      url: info.pageUrl,
      timestamp: new Date().toISOString(),
      color: 'yellow',
    };

    const { highlights = [] } = await chrome.storage.local.get('highlights');
    highlights.push(highlight);
    await chrome.storage.local.set({ highlights });

    // Inject content script to visually highlight
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: addHighlightToPage,
      args: [info.selectionText],
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Text Highlighted',
      message: 'Selection saved and highlighted',
    });
  } catch (error) {
    console.error('Failed to highlight:', error);
  }
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
 * Perform summarization (mock implementation)
 */
async function performSummarization(text, options = {}) {
  // In production, use chrome.summarizer or chrome.ai.languageModel
  // For now, return first few sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  return sentences.slice(0, 3).join(' ');
}

/**
 * Extract concepts (mock implementation)
 */
async function extractConcepts(text, options = {}) {
  // In production, use chrome.ai.languageModel
  const words = text.split(/\s+/).filter(w => w.length > 4);
  const uniqueWords = [...new Set(words)].slice(0, 10);

  return uniqueWords.map((word, index) => ({
    id: `concept-${index}`,
    label: word,
    type: index === 0 ? 'main' : 'secondary',
    connections: index < uniqueWords.length - 1 ? [`concept-${index + 1}`] : [],
  }));
}

/**
 * Helper function to extract page content (runs in page context)
 */
function extractPageContent() {
  const article = document.querySelector('article') || document.body;
  const content = article.innerText;
  const excerpt = content.substring(0, 300);

  return { content, excerpt };
}

/**
 * Generate mindmap from text
 */
async function generateMindmap(data) {
  try {
    const { text, title, url } = data;

    // Extract concepts
    const concepts = await extractConcepts(text, { persona: 'architect', maxConcepts: 8 });

    // Save as a reading with concepts
    const reading = {
      id: Date.now().toString(),
      title: title || 'Mindmap Reading',
      url: url || '',
      content: text,
      timestamp: new Date().toISOString(),
      concepts: concepts,
    };

    const { readings = [] } = await chrome.storage.local.get('readings');
    readings.unshift(reading);
    await chrome.storage.local.set({ readings });

    return { success: true, data: { reading, concepts } };
  } catch (error) {
    console.error('Failed to generate mindmap:', error);
    return { success: false, error: error.message };
  }
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
