# 🤖 Enable Chrome AI Features

The summarizer uses Chrome's built-in AI (Gemini Nano). Here's how to enable it:

---

## ✅ Step 1: Check Chrome Version

You need **Chrome 128 or higher**.

Check your version:
1. Go to `chrome://settings/help`
2. Look for version number (should be 128+)

If older, update Chrome first.

---

## 🚀 Step 2: Enable Chrome Flags

### Enable Required Flags:

1. Open `chrome://flags/` in a new tab

2. Search for and enable these flags:

   **a) Prompt API for Gemini Nano**
   - Search: `prompt-api-for-gemini-nano`
   - Set to: **Enabled**

   **b) Summarization API**
   - Search: `summarization-api-for-gemini-nano`
   - Set to: **Enabled**

   **c) AI Language Model API** (if available)
   - Search: `optimization-guide-on-device-model`
   - Set to: **Enabled BypassPerfRequirement**

3. Click **Relaunch** button at bottom

---

## 📥 Step 3: Download Gemini Nano Model

After enabling flags and restarting:

### Check Download Status:

1. Open DevTools Console (F12)
2. Paste and run:

```javascript
(async () => {
  const status = await ai.languageModel.capabilities();
  console.log('AI Status:', status);
})();
```

### Possible Results:

**If you see: `available: "readily"`**
✅ You're all set! AI is ready to use.

**If you see: `available: "after-download"`**
⏳ Chrome needs to download Gemini Nano (~22MB)

To trigger download:
```javascript
// This will start the download
const session = await ai.languageModel.create();
console.log('Download started...');
```

Wait 5-10 minutes, then check again.

**If you see: `available: "no"`**
❌ AI not available. Possible reasons:
- Chrome version too old
- Flags not enabled correctly
- Region restrictions
- Device not supported

### Alternative Check:

Go to: `chrome://components/`
- Look for **"Optimization Guide On Device Model"**
- If version shows 0.0.0.0 → Click "Check for update"
- Wait for download to complete

---

## 🧪 Step 4: Test AI in Your Extension

1. Open your extension popup
2. Open DevTools Console
3. Run:

```javascript
// Test language model
chrome.ai.languageModel.capabilities().then(console.log);

// Test summarizer
chrome.summarizer.capabilities().then(console.log);
```

If both return `{ available: 'readily' }`, you're good!

---

## 🐛 Troubleshooting

### AI Still Not Working?

**1. Restart Chrome Completely**
- Close ALL Chrome windows
- Reopen Chrome
- Check flags are still enabled

**2. Clear Chrome Data**
```
chrome://settings/clearBrowserData
```
- Clear last hour
- Don't clear passwords/autofill
- Restart Chrome

**3. Check System Requirements**
- Windows 10/11, macOS 13+, or ChromeOS
- 4GB+ RAM available
- Storage space for model (~1GB)

**4. Region Check**
Chrome AI may not be available in all regions yet. Check:
```javascript
navigator.language // Should show your locale
```

**5. Try Canary/Dev Channel**
If stable Chrome doesn't work:
- Download Chrome Canary: https://www.google.com/chrome/canary/
- AI features are more up-to-date there

---

## 🔄 Fallback Mode

If AI still doesn't work, the extension uses fallback mode:

**Fallback Features:**
- ✅ Basic text extraction (first 3 sentences)
- ✅ Simple concept extraction (keyword-based)
- ✅ All UI features still work
- ✅ Mock summaries for testing

**To test fallback:**
The extension automatically detects if AI is unavailable and uses fallback methods.

---

## 📊 Check Extension Status

Add this to your extension popup to see AI status:

1. Open popup
2. Check the console
3. You should see AI availability status

Or add a status indicator in the UI (we can add this if needed).

---

## ✅ Success Indicators

You'll know AI is working when:
- ✅ Summaries are coherent and contextual (not just first sentences)
- ✅ Concepts extracted are meaningful
- ✅ Persona changes affect output tone
- ✅ No "mock" or "fallback" messages in console

---

## 🎯 Quick Test

Once enabled, test with this:

1. Visit any article page (e.g., https://www.bbc.com/news)
2. Click extension icon → "Save Current Page"
3. Open Dashboard → Select the reading
4. Click "Generate Mindmap"
5. Check if concepts are meaningful

If yes → AI is working! 🎉
If no → Check console for errors and see troubleshooting above.

---

## 🆘 Still Having Issues?

1. **Check Chrome version**: Must be 128+
2. **Try Chrome Canary**: More stable AI features
3. **Use fallback mode**: Extension still works without AI
4. **Report bug**: Open GitHub issue with console errors

---

**Need help?** Share your console errors and we can debug further!
