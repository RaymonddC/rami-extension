# Quick Build Guide

## 🚀 Build in 3 Steps

### Step 1: Open Windows PowerShell
```powershell
# Navigate to project
cd D:\raymond\Documents\DESKTOP\Projects\rami-extension
```

### Step 2: Build
```powershell
npm run build
```

### Step 3: Reload Extension
```
1. Open chrome://extensions/
2. Find "AI Reading Studio"
3. Click the reload icon 🔄
```

**Done!** ✅

---

## 🧪 Quick Test

### Test 1: Generate Mindmap from Popup
1. Visit any article
2. Click extension icon
3. Click "Generate Mindmap"
4. See spinner: "Using AI to generate mindmap (up to 2 min)..."
5. Wait for AI (or fallback after 2 min)
6. Dashboard opens with mindmap
7. Check badge: 🤖 AI or ⚡ Fallback

### Test 2: Delete Reading
1. Go to Readings tab in dashboard
2. Hover over a reading
3. Red trash icon appears
4. Click → Confirm
5. Reading deleted

### Test 3: Mode Selector
1. Open mindmap
2. See mode selector bar
3. Click "Mermaid" → Diagram view
4. Click "React Flow" → Interactive view
5. Click "Hybrid" → Both views

---

## ⚠️ Common Issues

### Issue: Build fails with Rollup error
**Solution:** Build on Windows (not WSL)
```powershell
# If in WSL, switch to Windows PowerShell
exit  # Exit WSL
# Open PowerShell and build
```

### Issue: Extension not updating
**Solution:** Hard reload
```
1. chrome://extensions/
2. Click "Remove" on old extension
3. Click "Load unpacked"
4. Select dist/ folder again
```

### Issue: AI not working
**Solution:** Check Chrome AI flags
```
chrome://flags/#optimization-guide-on-device-model
chrome://flags/#prompt-api-for-gemini-nano
```
Both should be "Enabled"

---

## 📋 Files Changed This Session

**Modified (5 files):**
1. `src/utils/summarize.js` - AI timeout, error handling, connections
2. `src/pages/Popup.jsx` - Loading states, logging, character limit
3. `src/pages/Dashboard.jsx` - Delete, hash handling, badges
4. `src/components/MindmapView.jsx` - Edge styling
5. `src/content/reader.js` - Error messages

**No new files** - All changes were improvements to existing code!

---

## 🎯 What Changed

### AI System:
- ✅ Timeout: 30s → 120s (2 minutes)
- ✅ Added `outputLanguage: 'en'`
- ✅ Better error handling
- ✅ Always falls back if AI fails

### UI/UX:
- ✅ Separate loading states (Summarize ≠ Mindmap)
- ✅ Loading message shows "up to 2 min"
- ✅ Hover-to-delete with confirmation
- ✅ AI/Fallback badges on readings and mindmaps

### Features:
- ✅ Delete readings
- ✅ 50,000 character extraction (10x increase)
- ✅ Better mindmap connections (hub-and-spoke)
- ✅ Visual indicators for generation method

---

## 💡 Pro Tips

### Faster Mindmap:
Use right-click instead of popup:
1. Select text (100+ characters)
2. Right-click → Brain icon
3. Instant mindmap (<1 second)

### Check Console:
Right-click popup → Inspect → Console
- See all debug logs
- Track AI progress
- Monitor generation method

### Clear Storage:
```javascript
// In browser console:
chrome.storage.local.clear()
```
Useful for testing from scratch

---

## 📞 Need Help?

**Check documentation:**
- `SESSION_SUMMARY.md` - Complete changelog
- `AI_FALLBACK_IMPLEMENTATION.md` - AI system details
- `STORYBOARD_FEATURE.md` - Storyboard guide
- `TECH_DEBT.md` - Known issues

**Common questions:**
- Why is popup slow? → It uses AI (2 min timeout), right-click is fast (uses fallback)
- How to delete readings? → Hover over reading → Click trash icon
- What do badges mean? → 🤖 = AI generated, ⚡ = Fallback mode
- Where's mode selector? → Dashboard mindmap tab (when concepts exist)

---

**Build time:** ~30 seconds
**Extension reload:** 5 seconds
**Total:** Less than 1 minute to deploy! ⚡
