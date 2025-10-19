# Technical Debt

## Known Issues to Address Later

### 1. **Inconsistent Mindmap Generation Speed** 🐌⚡

**Issue:**
- Right-click mindmap: Fast (<1 second) - uses simple mock in background.js
- Popup mindmap: Slow (10 seconds) - tries LanguageModel AI, then falls back to mock

**Root Cause:**
- Two different `extractConcepts` implementations:
  - `src/background/background.js` (line 280-291): Simple word splitter
  - `src/utils/summarize.js` (line 309-366): Tries AI first, then fallback

**Impact:**
- Confusing UX - same feature, different speeds
- Popup button takes 10s to generate same result right-click does in 1s
- Loading indicator helps, but still slower than needed

**Possible Solutions:**
1. **Make both use mock extraction** (fast, consistent)
   - Remove AI call from popup flow
   - Both flows complete in <1 second
   - Simpler, more predictable

2. **Make both use AI** (slow, but "better" quality)
   - Import `summarize.js` into background script
   - Both flows wait for AI or timeout
   - More consistent, but slower overall

3. **Add user preference** (flexible)
   - Settings toggle: "Fast mode" vs "AI mode"
   - Let user choose speed vs AI quality
   - More complexity, but best UX

**Recommended Fix:** Option 1 - use mock extraction everywhere
- AI doesn't significantly improve mindmap quality for concept extraction
- Mock algorithm (capitalized words + frequent terms) works well
- 10x speed improvement

**Priority:** Medium
**Effort:** 1-2 hours

---

### 2. **Extension Context Invalidated Error**

**Issue:**
- After extension reloads, content scripts show "Extension context invalidated"
- Requires page reload to fix

**Impact:**
- User must reload page after updating extension
- Error message improved, but still requires manual action

**Solution:**
- Detect extension update and auto-reload content scripts
- Or show persistent banner: "Extension updated - please reload page"

**Priority:** Low
**Effort:** 2-3 hours

---

### 3. **Duplicate Mode Selector**

**Issue:**
- Mindmap mode selector exists in two places:
  - Options page (default setting)
  - Dashboard (per-session override)
- Both save to same preference

**Impact:**
- Potentially confusing which one is "the" setting
- Minor inconsistency

**Solution:**
- Document the relationship clearly
- Or remove one (keep only Options page)

**Priority:** Low
**Effort:** 15 minutes

---

## Future Improvements

### Performance
- [ ] Cache AI responses to avoid re-processing same text
- [ ] Lazy load React Flow library (reduce initial bundle size)
- [ ] Add service worker optimization for faster background processing

### Features
- [ ] Export mindmap as image/PDF
- [ ] Edit mindmap nodes manually
- [ ] Save multiple mindmap versions per reading
- [ ] Share mindmap via link

### UX
- [ ] Animated transitions when switching mindmap modes
- [ ] Tutorial/onboarding for first-time users
- [ ] Keyboard shortcuts for mindmap generation

---

**Last Updated:** 2025-10-19
