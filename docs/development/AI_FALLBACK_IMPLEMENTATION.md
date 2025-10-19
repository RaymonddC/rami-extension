# AI vs Fallback Implementation

## Overview

The mindmap generation now **prioritizes AI** and clearly indicates when fallback mode is used.

---

## ✅ Changes Made

### 1. **Increased AI Timeout: 10s → 30s**

**Before:** AI would timeout after 10 seconds (too fast)
**After:** AI gets full 30 seconds to respond

**File:** `src/utils/summarize.js` (line 254)
```javascript
setTimeout(() => reject(new Error('AI response timeout after 30 seconds')), 30000)
```

### 2. **Added Generation Method Tracking**

Every reading now stores HOW the concepts were generated:

**New fields in reading object:**
```javascript
{
  title: "Page Title",
  concepts: [...],
  generationMethod: "language-model-api" | "fallback",  // ← NEW
  usedAI: true | false,                                 // ← NEW
}
```

**File:** `src/pages/Popup.jsx` (lines 180-188)

### 3. **Visual Indicator in Dashboard**

Dashboard now shows a badge indicating generation method:

**🤖 AI Generated** (green badge) - Concepts created by LanguageModel API
**⚡ Fallback Mode** (yellow badge) - Concepts created by smart word extraction

**File:** `src/pages/Dashboard.jsx` (lines 149-159)

```
┌─────────────────────────────────────────────────┐
│ 🗺️ Visualization Mode:  [🤖 AI Generated]      │
│                                                 │
│  [React Flow]  [Mermaid]  [Hybrid]             │
└─────────────────────────────────────────────────┘
```

### 4. **Console Logging**

Clear console indicators:

**When using AI:**
```
✅ Using AI-generated concepts
🏷️ Generation method: language-model-api
```

**When using fallback:**
```
⚠️ Using fallback concept extraction (AI not available or timed out)
🏷️ Generation method: fallback
```

**File:** `src/pages/Popup.jsx` (lines 172-177, 190-202)

### 5. **Loading Message Update**

Button description now clearly states the timeout:

**Before:** "Generating mindmap..."
**After:** "Using AI to generate mindmap (up to 30s)..."

**File:** `src/pages/Popup.jsx` (line 288)

---

## 🎯 User Experience Flow

### AI Success (Most Common):
```
1. Click "Generate Mindmap"
   ↓
2. Spinner shows: "Using AI to generate mindmap (up to 30s)..."
   ↓
3. AI responds in 5-15 seconds
   ↓
4. Console: "✅ Using AI-generated concepts"
   ↓
5. Dashboard opens with green badge: "🤖 AI Generated"
```

### AI Timeout (Rare):
```
1. Click "Generate Mindmap"
   ↓
2. Spinner shows: "Using AI to generate mindmap (up to 30s)..."
   ↓
3. Wait full 30 seconds
   ↓
4. Console: "⚠️ New LanguageModel API failed: AI response timeout after 30 seconds"
   ↓
5. Console: "🔄 Falling back to mock concept extraction"
   ↓
6. Console: "⚠️ Using fallback concept extraction"
   ↓
7. Dashboard opens with yellow badge: "⚡ Fallback Mode"
```

---

## 📊 Method Comparison

| Aspect | AI (LanguageModel) | Fallback (Mock) |
|--------|-------------------|-----------------|
| **Speed** | 5-30 seconds | <1 second |
| **Quality** | Semantic understanding | Word frequency |
| **Reliability** | May timeout | Always works |
| **Indicator** | 🤖 AI Generated (green) | ⚡ Fallback Mode (yellow) |
| **When Used** | Default, if available | AI timeout/unavailable |

---

## 🧪 Testing

### Test AI Generation:
1. Build: `npm run build`
2. Reload extension
3. Visit article page
4. Click "Generate Mindmap"
5. **Watch console for:**
   ```
   ⏳ Sending prompt to AI (max 30 seconds)...
   ✅ AI response received, length: 1234
   ✅ Using AI-generated concepts
   ```
6. **Check dashboard badge:** Should show "🤖 AI Generated" (green)

### Test Fallback:
1. Disable internet or kill AI service
2. Click "Generate Mindmap"
3. Wait 30 seconds
4. **Watch console for:**
   ```
   ⚠️ New LanguageModel API failed: AI response timeout
   🔄 Falling back to mock concept extraction
   ⚠️ Using fallback concept extraction
   ```
5. **Check dashboard badge:** Should show "⚡ Fallback Mode" (yellow)

---

## 🔍 Debug Console Commands

### Check latest reading method:
```javascript
chrome.storage.local.get('readings', (result) => {
  const latest = result.readings[0];
  console.log('Generation method:', latest.generationMethod);
  console.log('Used AI:', latest.usedAI);
});
```

### Monitor all readings:
```javascript
chrome.storage.local.get('readings', (result) => {
  result.readings.forEach(r => {
    console.log(r.title, '→', r.usedAI ? '🤖 AI' : '⚡ Fallback');
  });
});
```

---

## 📁 Files Modified

1. **src/utils/summarize.js**
   - Line 254: Timeout increased to 30000ms

2. **src/pages/Popup.jsx**
   - Lines 172-177: AI/fallback detection logging
   - Lines 180-188: Added generationMethod and usedAI fields
   - Lines 190-202: Method-specific logging
   - Line 288: Updated loading message

3. **src/pages/Dashboard.jsx**
   - Lines 36-37: Log generation method on load
   - Lines 149-159: Visual badge for AI vs fallback

---

## ✨ Benefits

1. **User Transparency:** Clear indication of which method was used
2. **Better AI Success Rate:** 30s timeout gives AI more time
3. **Reliable Fallback:** Still works even if AI fails
4. **Debug Friendly:** Comprehensive console logging
5. **Visual Feedback:** Color-coded badges (green = AI, yellow = fallback)

---

## 🎉 Result

**Before:**
- 10s timeout (too short)
- No indication of AI vs fallback
- User confused why sometimes slow, sometimes fast

**After:**
- 30s timeout (gives AI proper time)
- Clear visual badge: 🤖 AI vs ⚡ Fallback
- Loading message sets expectations
- Console logs show exactly what's happening

---

**Build and test now!** 🚀
