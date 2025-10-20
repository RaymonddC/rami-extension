# Debug Guide: Mindmap Button Not Working

## Quick Diagnostic Steps

### 1. Check if Button Click is Registered

**Open Popup DevTools:**
```
1. Click extension icon to open popup
2. Right-click on popup > Inspect
3. Go to Console tab
```

**Add this to src/pages/Popup.jsx line 124:**
```javascript
const generateMindmap = async () => {
  console.log('🎯 MINDMAP BUTTON CLICKED'); // ADD THIS
  if (!currentTab) return;
  // ... rest
```

**Rebuild and test:**
```bash
npm run build
# Reload extension in chrome://extensions/
```

### 2. Check Current Tab

**The function needs currentTab to work. Add logging:**
```javascript
const generateMindmap = async () => {
  console.log('🎯 Button clicked');
  console.log('📍 Current tab:', currentTab); // ADD THIS

  if (!currentTab) {
    console.error('❌ NO CURRENT TAB!');
    alert('Error: Cannot access current tab');
    return;
  }
  // ... rest
```

### 3. Check Chrome Scripting Permission

**Verify manifest.json has:**
```json
{
  "permissions": [
    "scripting",  // <-- Must have this
    "activeTab",
    "tabs"
  ]
}
```

### 4. Test with Console Commands

**In popup DevTools console, run:**
```javascript
// Test 1: Can we get current tab?
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  console.log('Current tab:', tabs[0]);
});

// Test 2: Can we execute script?
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    func: () => ({ title: document.title })
  });
  console.log('Script result:', result);
});
```

### 5. Check for JavaScript Errors

**Look for these common errors:**
- `Cannot read property 'id' of undefined` → currentTab is null
- `chrome.scripting is undefined` → Missing permission
- `extractConcepts is not defined` → Import issue

### 6. Verify Function Import

**Check src/pages/Popup.jsx has:**
```javascript
import { extractConcepts } from '../utils/summarize'; // Line 16
```

### 7. Test extractConcepts Directly

**In popup console:**
```javascript
// Import the function
import { extractConcepts } from './utils/summarize.js';

// Test it
const result = await extractConcepts('This is a test about JavaScript and React development', {
  persona: 'architect',
  maxConcepts: 5
});
console.log('Concepts:', result);
```

## Common Issues & Fixes

### Issue 1: Button doesn't trigger anything
**Symptom:** No console logs, no errors
**Fix:** Check if onClick is properly connected
```javascript
// In Popup.jsx, verify this exists:
<QuickAction
  icon={<Network className="w-5 h-5" />}
  label="Generate Mindmap"
  onClick={generateMindmap}  // <-- Must be here
/>
```

### Issue 2: "currentTab is undefined"
**Symptom:** Console shows currentTab = null
**Fix:** useEffect may not be running
```javascript
// Check line 38-45 in Popup.jsx
useEffect(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log('📍 Setting current tab:', tabs[0]);
    if (tabs[0]) {
      setCurrentTab(tabs[0]);
    }
  });
}, []);
```

### Issue 3: "chrome.scripting.executeScript failed"
**Symptom:** Error about scripting permission
**Fix:**
1. Check manifest.json has "scripting" permission
2. Rebuild: `npm run build`
3. Remove and re-add extension in chrome://extensions/

### Issue 4: extractConcepts returns empty
**Symptom:** No concepts generated
**Check:**
```javascript
// Add logging in src/utils/summarize.js line 309:
export async function extractConcepts(text, options = {}) {
  console.log('🔍 Extract concepts called');
  console.log('Text length:', text?.length);
  console.log('Options:', options);

  // ... rest of function

  console.log('📊 Final result:', result);
  return result;
}
```

### Issue 5: Nothing saved to storage
**Check Chrome Storage:**
```
1. Open DevTools (F12)
2. Application tab
3. Storage > Local Storage
4. Find chrome-extension://[your-extension-id]
5. Look for 'readings' key
```

**Test storage manually:**
```javascript
// In popup console:
chrome.storage.local.get('readings', (result) => {
  console.log('Readings:', result.readings);
});
```

## Step-by-Step Debug Flow

```javascript
// Add this complete debug version to Popup.jsx:

const generateMindmap = async () => {
  console.log('=== MINDMAP GENERATION START ===');

  // Step 1: Check tab
  console.log('1️⃣ Current tab:', currentTab);
  if (!currentTab) {
    console.error('❌ No current tab available');
    alert('Error: Cannot access current tab');
    return;
  }

  setLoading(true);
  console.log('2️⃣ Loading state set to true');

  try {
    // Step 2: Extract content
    console.log('3️⃣ Executing script on tab:', currentTab.id);
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: () => ({
        text: (document.querySelector('article') || document.body).innerText.substring(0, 5000),
        title: document.title
      })
    });

    console.log('4️⃣ Script result:', result?.result);
    const pageContent = result.result;

    // Step 3: Extract concepts
    console.log('5️⃣ Calling extractConcepts...');
    const conceptResult = await extractConcepts(pageContent.text, {
      persona: preferences?.persona || 'architect',
      maxConcepts: 8,
    });

    console.log('6️⃣ Concept result:', conceptResult);

    if (conceptResult.success && conceptResult.concepts.length > 0) {
      // Step 4: Save reading
      const reading = {
        title: pageContent.title,
        url: currentTab.url,
        content: pageContent.text,
        timestamp: new Date().toISOString(),
        concepts: conceptResult.concepts,
      };

      console.log('7️⃣ Saving reading:', reading);
      await chrome.runtime.sendMessage({
        action: 'save-reading',
        data: reading,
      });

      // Step 5: Open dashboard
      console.log('8️⃣ Opening dashboard');
      chrome.tabs.create({
        url: chrome.runtime.getURL('dashboard.html') + '#mindmap',
      });

      console.log('✅ MINDMAP GENERATION SUCCESS');
    } else {
      console.error('❌ No concepts generated:', conceptResult);
      alert('Failed to generate mindmap. No concepts extracted.');
    }
  } catch (error) {
    console.error('💥 ERROR:', error);
    alert('Failed to generate mindmap: ' + error.message);
  } finally {
    setLoading(false);
    console.log('9️⃣ Loading state set to false');
    console.log('=== MINDMAP GENERATION END ===');
  }
};
```

## Testing Checklist

- [ ] Popup opens correctly
- [ ] Console accessible via right-click > Inspect
- [ ] Click button shows "MINDMAP BUTTON CLICKED" log
- [ ] currentTab is not null/undefined
- [ ] Script execution succeeds
- [ ] extractConcepts is called
- [ ] Concepts are generated (check log)
- [ ] Reading saved to storage
- [ ] Dashboard opens in new tab
- [ ] Mindmap displays on dashboard

## Last Resort: Start Fresh

If nothing works:

```bash
# 1. Clean rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build

# 2. Remove extension from Chrome
# chrome://extensions/ > Remove

# 3. Re-add extension
# chrome://extensions/ > Load unpacked > Select dist/ folder

# 4. Test on simple page
# Go to: https://en.wikipedia.org/wiki/JavaScript
# Click extension icon
# Click "Generate Mindmap"
```

## Contact Info for Debugging

When reporting issue, provide:
1. Console logs from popup DevTools
2. Console logs from background service worker (chrome://extensions/ > service worker)
3. Chrome version: `chrome://version/`
4. Extension manifest version
5. Any error messages
