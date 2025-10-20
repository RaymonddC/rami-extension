# Session Notes - AI Reading Studio

## Current Status

### ✅ Completed
- Added "Generate Mindmap" button to popup (src/pages/Popup.jsx:243-248)
- Implemented `generateMindmap()` function in popup that extracts page content
- Enhanced fallback concept extraction algorithm (smarter word detection)
- Fixed dynamic import error in content script
- Added background script handlers for mindmap generation
- Built extension successfully in `dist/` folder

### ❌ Issue: Mindmap Button Does Nothing
**Problem:** When clicking "Generate Mindmap" button in popup, nothing happens.

**What Should Happen:**
1. Click "Generate Mindmap" button
2. Extension extracts page content (first 5000 chars)
3. Calls `extractConcepts()` to generate mindmap nodes
4. Saves reading with concepts to Chrome storage
5. Opens dashboard.html#mindmap tab
6. Shows mindmap visualization

**Possible Causes to Debug:**
1. Check browser console for errors when clicking button
2. Verify popup.js is loading correctly (check DevTools on popup)
3. Check if `extractConcepts` is being called (console.log in src/utils/summarize.js:309)
4. Check if Chrome storage is saving the reading (DevTools > Application > Storage)
5. Verify manifest.json has correct permissions for scripting
6. Check if the button onClick handler is connected

## Files Modified This Session

### src/pages/Popup.jsx (Lines 124-178, 243-248)
- Added `generateMindmap()` async function
- Extracts page content via `chrome.scripting.executeScript`
- Calls `extractConcepts()` with architect persona
- Saves reading with concepts
- Opens dashboard.html#mindmap

```javascript
const generateMindmap = async () => {
  if (!currentTab) return;
  setLoading(true);

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: () => ({
        text: (document.querySelector('article') || document.body).innerText.substring(0, 5000),
        title: document.title
      })
    });

    const conceptResult = await extractConcepts(pageContent.text, {
      persona: preferences?.persona || 'architect',
      maxConcepts: 8,
    });

    if (conceptResult.success && conceptResult.concepts.length > 0) {
      await chrome.runtime.sendMessage({
        action: 'save-reading',
        data: reading,
      });
      chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html') + '#mindmap',
      });
    }
  } catch (error) {
    console.error('Failed to generate mindmap:', error);
    alert('Failed to generate mindmap: ' + error.message);
  } finally {
    setLoading(false);
  }
};
```

### src/utils/summarize.js (Lines 309-353, 428-493)
- `extractConcepts()` - Uses Language Model API or fallback
- `mockExtractConcepts()` - Improved fallback algorithm:
  - Finds capitalized words (important nouns)
  - Finds frequently occurring words
  - Creates 8 concept nodes with connections
  - Labels them as main/secondary/tertiary

### src/content/reader.js (Lines 455-491)
- Changed `generateMindmapFromSelection()` to use message passing instead of dynamic import
- Sends to background script: `{action: 'generate-mindmap', data: {text, title, url}}`

### src/background/background.js
- Added action handlers (lines 91-107):
  - `generate-mindmap` - Calls `generateMindmap()`
  - `open-dashboard` - Opens dashboard with tab parameter
  - `save-highlight` - Saves highlight to storage
- Added `generateMindmap()` function (lines 307-333)
- Added `saveHighlight()` function (lines 338-356)

## Debugging Steps for Next Session

1. **Check Console Errors:**
   ```javascript
   // Open popup, right-click > Inspect
   // Click "Generate Mindmap" button
   // Check for errors in Console tab
   ```

2. **Add Debug Logging:**
   ```javascript
   // In src/pages/Popup.jsx, line 124:
   const generateMindmap = async () => {
     console.log('🧠 Generate Mindmap clicked');
     console.log('Current tab:', currentTab);
     if (!currentTab) {
       console.error('❌ No current tab');
       return;
     }
     // ... rest of function
   };
   ```

3. **Check extractConcepts:**
   ```javascript
   // In src/utils/summarize.js, line 309:
   export async function extractConcepts(text, options = {}) {
     console.log('🔍 extractConcepts called with:', {
       textLength: text?.length,
       persona: options.persona,
       maxConcepts: options.maxConcepts
     });
     // ... rest of function
   }
   ```

4. **Verify Storage:**
   ```javascript
   // In Chrome DevTools:
   // Application tab > Storage > Local Storage > chrome-extension://...
   // Check for 'readings' key with concepts
   ```

5. **Test Manually in Console:**
   ```javascript
   // In popup console:
   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
     console.log('Current tab:', tabs[0]);
   });
   ```

6. **Check if Button is Connected:**
   - Verify the QuickAction onClick prop is set correctly
   - Check if generateMindmap function is in scope
   - Add console.log at start of function to confirm it's called

## How to Continue Development

1. **Rebuild and Reload:**
   ```bash
   npm run build
   # Then reload extension in chrome://extensions/
   ```

2. **Check Popup DevTools:**
   - Right-click extension icon > Inspect popup
   - Watch console when clicking "Generate Mindmap"

3. **Check Background Script Console:**
   - Go to chrome://extensions/
   - Click "service worker" link under your extension
   - Watch for background script logs

4. **Test with Simple Page:**
   - Go to a simple article (like Wikipedia)
   - Click extension icon
   - Click "Generate Mindmap"
   - Check console at each step

## Quick Reference

**Project Structure:**
```
rami-extension/
├── dist/                    # Built extension (load this in Chrome)
├── src/
│   ├── pages/
│   │   ├── Popup.jsx       # Extension popup (Generate Mindmap button)
│   │   └── Dashboard.jsx   # Main dashboard with mindmap view
│   ├── components/
│   │   └── MindmapView.jsx # React Flow mindmap visualization
│   ├── utils/
│   │   └── summarize.js    # AI functions (extractConcepts)
│   ├── content/
│   │   └── reader.js       # Content script
│   └── background/
│       └── background.js   # Service worker
├── manifest.json
└── package.json
```

**Build Command:**
```bash
npm run build
```

**Chrome AI Flags:**
- chrome://flags/#optimization-guide-on-device-model
- chrome://flags/#prompt-api-for-gemini-nano
- chrome://flags/#summarization-api-for-gemini-nano

**Test AI Status:**
```javascript
// In browser console:
console.log(await ai.languageModel.capabilities());
console.log(await ai.summarizer.capabilities());
```

## Known Issues

1. **Mindmap button does nothing** ⚠️ ACTIVE ISSUE
   - No visible error
   - Need to debug with console logging
   - Check if onClick is firing

2. **Rollup errors on build**
   - Solution: `rm -rf node_modules package-lock.json && npm install`
   - Happens in WSL sometimes

3. **MIME type errors**
   - Solution: Always load from `dist/` folder after building
   - Never load from `src/` directly

## Next Steps

1. Debug why mindmap button doesn't work
2. Add better error handling/feedback in popup
3. Test with Chrome AI when available
4. Improve concept extraction quality
5. Add loading states during mindmap generation

---
**Last Updated:** 2025-10-18
**Extension Version:** 1.0.0
**Status:** In Development
