# 🧪 Test AI Status

Quick guide to check if Chrome AI is working in your extension.

---

## 🔍 Step 1: Check Console Messages

After loading the extension, open DevTools Console (F12) and you'll see helpful messages:

### If AI is Working ✅
```
🤖 Language Model status: { available: 'readily' }
📝 Summarizer status: { available: 'readily' }
✅ AI is ready!
```

### If AI Needs Setup ⚠️
```
⚠️ Chrome AI not available. Please enable it in chrome://flags/
Enable: Prompt API for Gemini Nano, Summarization API
⚠️ AI not ready. Using fallback mode. See console for details.
```

### If Model Needs Download 📥
```
⏳ AI models not ready. Status: { languageModel: 'after-download', ... }
📥 Gemini Nano needs to download. This may take a few minutes.
💡 Trigger download: await ai.languageModel.create()
```

---

## 🧪 Step 2: Test in Console

Open DevTools Console and test directly:

### Test 1: Check if AI exists
```javascript
console.log('AI available:', !!self.ai);
```

Expected: `true` if Chrome AI is enabled

### Test 2: Check Language Model
```javascript
self.ai.languageModel.capabilities().then(console.log);
```

Expected: `{ available: 'readily' }` or `{ available: 'after-download' }`

### Test 3: Check Summarizer
```javascript
self.ai.summarizer.capabilities().then(console.log);
```

Expected: `{ available: 'readily' }` or `{ available: 'after-download' }`

### Test 4: Trigger Download (if needed)
```javascript
// This will start downloading Gemini Nano (~22MB)
self.ai.languageModel.create().then(() => {
  console.log('Download started! Check chrome://components/');
});
```

---

## 🎯 Step 3: Test Extension Features

### Test Summarization
1. Visit any article (e.g., https://en.wikipedia.org/wiki/Artificial_intelligence)
2. Click extension icon
3. Click "Save Current Page"
4. Check console for:
   - `🤖 Using Chrome AI Summarizer` ← AI working!
   - `📝 Summarizer not available, using fallback` ← AI not ready

### Test Mindmap Generation
1. Open Dashboard
2. Select a saved reading
3. Go to "Mindmap" tab
4. Click "Generate Mindmap"
5. Check console for:
   - `🤖 Using Gemini Nano Language Model` ← AI working!
   - `🤖 Language Model not available, using mock` ← Fallback mode

---

## 🔍 Step 4: Check Chrome Components

Go to `chrome://components/` and find:

**"Optimization Guide On Device Model"**
- Version shows `0.0.0.0` → Not downloaded, click "Check for update"
- Version shows a number (e.g., `2024.5.5.0`) → Downloaded! ✅

---

## 💡 Understanding the Messages

### Console Emoji Guide

| Emoji | Meaning |
|-------|---------|
| ✅ | AI is working perfectly |
| ⚠️ | AI not available, using fallback |
| ⏳ | AI available but needs download |
| 📥 | Download in progress |
| 🤖 | Using real AI (Gemini Nano) |
| ❌ | Error occurred |
| ↩️ | Falling back to mock/simple mode |

---

## 🐛 Common Issues & Solutions

### Issue: `self.ai is undefined`

**Solution:**
1. Enable flags at `chrome://flags/`
   - Prompt API for Gemini Nano → Enabled
   - Summarization API → Enabled
2. Restart Chrome completely
3. Reload extension

---

### Issue: `available: 'after-download'`

**Solution:**
1. Wait 5-10 minutes for auto-download
2. Or manually trigger:
   ```javascript
   self.ai.languageModel.create();
   ```
3. Check progress at `chrome://components/`

---

### Issue: `available: 'no'`

**Possible causes:**
- Chrome version < 128 (update Chrome)
- Flags not enabled (check chrome://flags/)
- Region not supported (try Chrome Canary)
- Device requirements not met (need 4GB+ RAM)

**Solution:**
1. Update to Chrome 128+
2. Enable all AI flags
3. Restart Chrome
4. If still no, try Chrome Canary

---

## ✅ Success Checklist

You know AI is working when:

- [x] Console shows `✅ AI is ready!`
- [x] Console shows `🤖 Using Chrome AI Summarizer`
- [x] Console shows `🤖 Using Gemini Nano Language Model`
- [x] Summaries are coherent (not just first 3 sentences)
- [x] Mindmaps have meaningful concepts
- [x] Persona changes affect output

---

## 🎓 Next Steps

### If AI is Working:
1. Test all 5 personas
2. Try different article types
3. Experiment with prompt chains
4. Generate complex mindmaps

### If AI is Not Working:
1. Follow `ENABLE_CHROME_AI.md` setup guide
2. Extension still works in fallback mode!
3. All UI features functional
4. Can test interface and design

---

## 📊 Fallback Mode Features

When AI isn't available, the extension uses:

**Simple Summarization:**
- Extracts first 3 sentences
- Fast and reliable
- Good for testing UI

**Mock Concepts:**
- Extracts keywords from text
- Creates simple connections
- Tests visualization modes

**Persona Responses:**
- Pre-written persona-specific messages
- Demonstrates UI behavior
- Shows expected format

**All UI Features Work:**
- ✅ Saving pages
- ✅ Highlighting text
- ✅ Creating notes
- ✅ All 3 mindmap modes
- ✅ Storyboard view
- ✅ Prompt chains
- ✅ Theme switching

---

## 🆘 Still Not Working?

1. **Share console output** - Copy all messages
2. **Check Chrome version** - Must be 128+
3. **Try Chrome Canary** - Latest AI features
4. **Check region** - AI may not be available everywhere
5. **Open GitHub issue** - We can help debug

---

**Remember:** The extension works great even without AI! Fallback mode lets you test everything while you set up Chrome AI. 🚀
