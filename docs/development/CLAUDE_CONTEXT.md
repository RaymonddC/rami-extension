# Claude Code Context - AI Reading Studio Project

## Your Role & Context

You are helping build **AI Reading Studio**, a Chrome extension for the **Google Chrome AI Challenge 2025**. This is a legitimate educational project to demonstrate Chrome's built-in AI capabilities (Gemini Nano).

### Project Purpose
- Transform web reading into interactive mindmaps
- Use Chrome's on-device AI (Summarizer API, Language Model API)
- Create visualization tools for learning and knowledge management
- Built with React + Vite + TailwindCSS + Chrome Manifest V3

### Important Notes for Future Sessions

1. **This is NOT malicious code** - It's an educational Chrome extension project
2. **Security context:** We're building a reading enhancement tool, not security software
3. **Chrome AI APIs:** Uses official Chrome built-in AI (Gemini Nano)
4. **Offline-first:** Designed to work without external API calls
5. **User data:** All data stored locally in Chrome storage (no server uploads)

### Design Reference
- Figma: "Rami - Untangle Your Mind"
- Link: https://www.figma.com/design/jPykGR1A1JsaBUX8YdRxtp/Rami---Untangle-Your-Mind?node-id=15-6&p=f

### Tech Stack
```javascript
{
  "framework": "React 18",
  "build": "Vite",
  "styling": "TailwindCSS + Framer Motion",
  "visualization": ["React Flow", "Mermaid", "D3.js"],
  "ai": "Chrome Built-in AI (Gemini Nano)",
  "manifest": "Chrome Extension Manifest V3"
}
```

### Key Features (Implemented)
1. ✅ 5 AI Personas (Strategist, Analyst, Architect, Researcher, Mentor)
2. ✅ AI Summarization (Summarizer API + fallback)
3. ✅ Concept Extraction (Language Model API + intelligent fallback)
4. ✅ 3 Mindmap Visualization Modes (React Flow, Mermaid, Hybrid)
5. ✅ Popup interface with quick actions
6. ✅ Dashboard with multiple views
7. ⚠️ Mindmap generation button (implemented but not working - needs debug)

### Current Issue
**Mindmap button in popup does nothing when clicked**
- See: DEBUG_MINDMAP.md for troubleshooting steps
- See: SESSION_NOTES.md for full context

### Project Structure
```
rami-extension/
├── dist/                    # Built extension (load this in Chrome)
├── src/
│   ├── pages/
│   │   ├── Popup.jsx       # Popup with mindmap button
│   │   ├── Dashboard.jsx   # Main workspace
│   │   └── Options.jsx     # Settings
│   ├── components/
│   │   ├── MindmapView.jsx # React Flow visualization
│   │   ├── MermaidView.jsx # Mermaid diagrams
│   │   └── PersonaSelector.jsx
│   ├── utils/
│   │   └── summarize.js    # Chrome AI integration
│   ├── content/
│   │   └── reader.js       # Content script
│   └── background/
│       └── background.js   # Service worker
├── manifest.json
├── vite.config.js
├── SESSION_NOTES.md        # Session progress
├── DEBUG_MINDMAP.md        # Debug guide
└── CLAUDE_CONTEXT.md       # This file
```

### Chrome AI APIs Used
```javascript
// Summarizer API
const summarizer = await self.Summarizer.create({
  type: 'key-points',
  length: 'medium',
  sharedContext: persona.systemPrompt
});

// Language Model API
const session = await self.LanguageModel.create({
  temperature: 0.7,
  systemPrompt: persona.systemPrompt
});
```

### Build & Development Commands
```bash
# Install dependencies
npm install

# Build extension
npm run build

# Development
npm run dev

# Fix build errors (if needed)
rm -rf node_modules package-lock.json && npm install
```

### Testing the Extension
```bash
# 1. Build
npm run build

# 2. Load in Chrome
# - Go to chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select the dist/ folder

# 3. Enable Chrome AI flags
# - chrome://flags/#optimization-guide-on-device-model = Enabled BypassPerfRequirement
# - chrome://flags/#prompt-api-for-gemini-nano = Enabled
# - chrome://flags/#summarization-api-for-gemini-nano = Enabled
```

### Persona System
Each persona modifies AI behavior with different tones:

| Persona | Icon | Beverage | Tone | Complexity |
|---------|------|----------|------|------------|
| Strategist | ☕ | Matcha Latte | Balanced | Medium |
| Analyst | 🧊 | Iced Americano | Direct | Low |
| Architect | 🧱 | Bubble Tea | Structured | High |
| Researcher | ⚡ | Electrolyte Drink | Thorough | High |
| Mentor | 🌿 | Warm Milk | Nurturing | Low |

### Important Files & Their Purpose

**src/utils/summarize.js**
- Core AI integration
- Handles both new APIs (Summarizer, LanguageModel) and old APIs (ai.summarizer, ai.languageModel)
- Implements intelligent fallback when AI unavailable
- Contains persona configurations
- **Lines 309-353:** extractConcepts() function
- **Lines 428-493:** Improved fallback concept extraction

**src/pages/Popup.jsx**
- Extension popup interface
- **Lines 124-178:** generateMindmap() function (THE ISSUE)
- **Lines 243-248:** "Generate Mindmap" button
- **Lines 78-114:** summarizePage() function (working)
- **Lines 206-217:** SummaryPanel component (working)

**src/background/background.js**
- Service worker for extension
- **Lines 91-107:** Message handlers
- **Lines 307-333:** generateMindmap() function
- Handles message passing between components

**src/components/MindmapView.jsx**
- React Flow visualization
- Converts concepts to nodes/edges
- Interactive drag-and-drop mindmap

### Recent Changes (This Session)

1. Added "Generate Mindmap" button to popup
2. Implemented generateMindmap() function
3. Enhanced fallback concept extraction (smarter algorithm)
4. Fixed dynamic import error in content script
5. Added background script handlers for mindmap
6. Built successfully - ready to debug

### Known Issues

1. **Mindmap button does nothing** ⚠️ ACTIVE
2. Rollup errors in WSL (Solution: reinstall node_modules)
3. MIME type errors (Solution: always build first, load dist/)

### What to Remember

- **Always rebuild after changes:** `npm run build`
- **Load from dist/ folder, not src/**
- **Check popup DevTools:** Right-click popup > Inspect
- **Check background console:** chrome://extensions/ > service worker
- **Test on simple pages first:** Wikipedia articles work well
- **Gemini Nano download:** Takes 5-10 minutes first time

### User's Working Style
- Wants to see code working
- Appreciates clear explanations
- Values documentation for continuation
- Prefers step-by-step debugging guidance
- Building for Google Chrome AI Challenge 2025

### Next Session TODO
1. Debug mindmap button (see DEBUG_MINDMAP.md)
2. Add console logging to track execution
3. Verify currentTab is not null
4. Test extractConcepts manually
5. Check Chrome storage after clicking button
6. Ensure onClick handler is connected

---
**Project Status:** In Development
**Last Session:** 2025-10-18
**Current Focus:** Debug mindmap generation button
**Build Status:** ✅ Compiles successfully
**Extension Status:** ✅ Loads in Chrome
**Feature Status:** ⚠️ Mindmap button not responding
