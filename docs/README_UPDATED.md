# 🧠 RAMI - Untangle Your Mind

*A Chrome Extension built with Gemini Nano for creative reading, learning, and reflection.*

> Rami helps you read less, understand more, and think visually.

---

## 🎯 Overview

**Rami** is an AI-powered **reading workspace** that turns web pages into **summaries, mindmaps, and storyboards** — all offline, inside Chrome.

It's designed for curious thinkers who want to **untangle complex ideas** and transform reading into insight.

**Think:** Notion + Miro + Gemini Nano for readers, students, and creators.

**Figma Design:** [Rami - Untangle Your Mind](https://www.figma.com/design/jPykGR1A1JsaBUX8YdRxtp/Rami---Untangle-Your-Mind)

---

## ✨ Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| 📖 **Offline Reading Mode** | Save and summarize web pages using Chrome AI (Gemini Nano) | ✅ Working |
| 🗺️ **Mindmap Visualization** | Choose between **React Flow**, **Mermaid**, or **Hybrid View** | ✅ Working |
| 🤖 **AI-Powered Extraction** | 2-minute timeout with smart fallback | ✅ New |
| 🏷️ **Generation Badges** | Visual indicators: 🤖 AI or ⚡ Fallback | ✅ New |
| 🔗 **Connected Concepts** | Hub-and-spoke pattern with animated lines | ✅ Fixed |
| 🗑️ **Delete Readings** | Hover to delete with confirmation | ✅ New |
| 📝 **Prompt Chain Editor** | Build reasoning flows like *Summarize → Extract → Visualize → Reflect* | ✅ Working |
| ✏️ **Highlights + Notes** | Highlight text, link to mindmap nodes, save locally | ✅ Working |
| 🎬 **Visual Storyboarding** | Convert mindmaps into linear narratives | ✅ Working |
| 🔒 **Offline-First** | Gemini Nano processes locally for privacy | ✅ Working |

---

## 🗺️ Mindmap Modes

### 1. React Flow View
- Draggable, interactive node graph
- Zoom and pan controls
- Color-coded nodes (main/secondary/tertiary)
- Animated connecting lines

### 2. Mermaid View
- Text-based markdown-like diagrams
- Exportable code
- Clean, standardized look

### 3. Hybrid Mode
- Side-by-side: React Flow + Mermaid
- Visual editing + code export
- Best of both worlds

**Mode Selector** available in Dashboard - switch anytime!

---

## 🤖 AI System

### Language Model Integration
- **Primary:** Chrome LanguageModel API (Gemini Nano)
- **Timeout:** 120 seconds (2 minutes)
- **Fallback:** Smart word extraction if AI unavailable
- **Output Language:** English (`en`)

### Visual Indicators
**AI Generated** (Green Badge):
```
🤖 AI Generated
```
Concepts created by LanguageModel API with semantic understanding.

**Fallback Mode** (Yellow Badge):
```
⚡ Fallback Mode
```
Concepts created by smart extraction (capitalized words + frequency analysis).

### Text Extraction
- **Limit:** 50,000 characters per page
- **Source:** `<article>` element or `<body>` fallback
- **Processing:** Local, offline, private

---

## 🎭 Persona System

Rami adapts to your preferred thinking style. Each persona shapes the **AI's reasoning, tone, and interaction style**.

| Persona | Description | Tone | Beverage |
|---------|-------------|------|----------|
| ☕ **The Strategist** | Calm, layered, thoughtful | Balanced guidance | Matcha Latte |
| 🧊 **The Analyst** | Clear, sharp, logical | Direct & efficient | Iced Americano |
| 🧋 **The Architect** | Structured, modular, precise | Systematic clarity | Bubble Tea |
| ⚡ **The Researcher** | Data-driven, curious, deep | Analytical focus | Electrolyte Drink |
| 🌿 **The Mentor** | Gentle, wise, comforting | Supportive teaching | Warm Milk |

Each persona modifies Rami's AI prompt template dynamically during summarization and visualization.

---

## 🎬 Storyboard Feature

**Transform mindmaps into linear narratives!**

### What It Does:
- Converts web of concepts → Sequential story
- Each concept becomes a frame
- Add titles, content, visual placeholders
- Navigate with arrows or timeline
- Perfect for presentations, learning paths, tutorials

### Use Cases:
- 📚 Learning paths (step-by-step progression)
- 📊 Presentations (mindmap → slides)
- 📝 Process documentation (workflows)
- 📖 Storytelling (narrative sequences)

**See:** `docs/user-guides/STORYBOARD_FEATURE.md` for complete guide

---

## 🛠️ Tech Stack

- **React 18 + Vite**
- **TailwindCSS + Framer Motion**
- **React Flow + Mermaid**
- **Chrome Manifest V3**
- **Gemini Nano** (`chrome.ai.languageModel` / `LanguageModel`)
- **chrome.summarizer**
- **chrome.storage.local**
- **Lucide Icons**

---

## 🔧 Chrome APIs Used

```javascript
chrome.ai.languageModel      // Reasoning & summarization (Gemini Nano)
LanguageModel               // New API (alternative)
chrome.summarizer           // Quick summarization of selected text
chrome.storage.local        // Save highlights, notes, persona settings
chrome.contextMenus         // "Save to Rami" in right-click menu
chrome.runtime & tabs       // Communication between components
chrome.scripting            // Content extraction
```

---

## 📦 Installation & Setup

### Prerequisites
- Chrome Canary (v131+)
- Enable Chrome AI flags

### Enable Chrome AI:
```
1. chrome://flags/#optimization-guide-on-device-model → Enabled
2. chrome://flags/#prompt-api-for-gemini-nano → Enabled
3. chrome://flags/#summarization-api-for-gemini-nano → Enabled
4. Restart Chrome
```

### Verify AI is Ready:
```javascript
// Open DevTools Console:
console.log(await ai.languageModel.capabilities());
// Should show: {available: "readily"}
```

**See:** `docs/user-guides/ENABLE_CHROME_AI.md` for detailed setup

### Install Extension:
```bash
# Clone repo
git clone <repository-url>
cd rami-extension

# Install dependencies
npm install

# Build extension (ON WINDOWS - WSL has Rollup issues)
npm run build

# Load in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the `dist/` folder
```

**See:** `docs/development/BUILD_INSTRUCTIONS.md` for troubleshooting

---

## 🚀 Quick Start

### 1. Save a Page
- Visit any article
- Click extension icon → "Save Current Page"
- Or right-click → "Save to AI Reading Studio"

### 2. Generate Mindmap
**From Popup:**
- Click extension icon
- Click "Generate Mindmap"
- Wait up to 2 minutes for AI
- Dashboard opens with mindmap

**From Right-Click:**
- Select text (100+ characters)
- Right-click → "Highlight and Analyze" → 🧠 icon
- Fast generation (<1 second)

### 3. Explore Views
- **Readings:** Manage saved pages
- **Mindmap:** Interactive concept visualization
- **Storyboard:** Linear narrative view
- **Prompts:** Build reasoning chains

### 4. Customize
- Click ⚙️ Settings
- Choose persona
- Set default mindmap mode
- Enable/disable features

---

## 📊 Current Status (v1.0.0)

### ✅ Fully Working:
- Popup mindmap generation (AI + fallback)
- Right-click mindmap generation (fast)
- Dashboard with 3 mindmap modes
- Delete readings functionality
- AI/Fallback visual indicators
- Separate loading states
- Comprehensive error handling
- 50,000 character extraction

### ⚠️ Known Issues (Tech Debt):
1. **Speed inconsistency** - Popup (slow) vs right-click (fast)
2. **Extension context error** - Requires page reload after update

**See:** `docs/development/TECH_DEBT.md` for details

---

## 📚 Documentation

### User Guides:
- `docs/user-guides/QUICKSTART.md` - 5-minute guide
- `docs/user-guides/STORYBOARD_FEATURE.md` - Complete storyboard explanation
- `docs/user-guides/ENABLE_CHROME_AI.md` - AI setup guide
- `docs/user-guides/TEST_AI_STATUS.md` - Test your AI setup

### Developer Docs:
- `docs/PROJECT_SUMMARY.md` - Project overview
- `docs/development/SESSION_SUMMARY.md` - Latest changes
- `docs/development/AI_FALLBACK_IMPLEMENTATION.md` - AI system details
- `docs/development/TECH_DEBT.md` - Known issues
- `docs/development/BUILD_INSTRUCTIONS.md` - Platform-specific builds

### Troubleshooting:
- `docs/development/FIX_BUILD_ERROR.md` - Build issues
- `docs/development/DEBUG_MINDMAP.md` - Mindmap debugging

---

## 🧪 Testing

### Mindmap Generation:
```
✅ Popup button shows loading spinner
✅ AI processes for up to 2 minutes
✅ Falls back to mock if timeout
✅ Dashboard opens on mindmap tab
✅ Concepts display with connections
✅ Badge shows generation method
```

### Mode Switching:
```
✅ React Flow - Interactive nodes
✅ Mermaid - Text diagram
✅ Hybrid - Side-by-side
```

### Delete:
```
✅ Hover shows trash icon
✅ Click shows confirmation
✅ Delete removes from storage
✅ UI updates immediately
```

**See:** `docs/development/SESSION_SUMMARY.md` for complete testing checklist

---

## 🎯 Use Cases

### For Students:
- Save lecture materials
- Generate study mindmaps
- Create learning sequences in storyboard
- Highlight and annotate

### For Researchers:
- Organize research papers
- Visualize concept relationships
- Build knowledge graphs
- Track reading progress

### For Creators:
- Collect inspiration
- Brainstorm visually
- Plan content with storyboards
- Organize ideas systematically

### For Learners:
- Break down complex topics
- Sequential learning paths
- Visual understanding
- Personal knowledge base

---

## 🤝 Contributing

This is a Chrome AI Challenge 2025 submission.

**Feedback welcome!**
- Report issues on GitHub
- Suggest features
- Share use cases

---

## 📄 License

[Add your license here]

---

## 🙏 Acknowledgments

- **Chrome Team** - For Gemini Nano and Chrome AI APIs
- **React Flow** - For amazing mindmap visualization
- **Mermaid** - For diagram generation
- **Tailwind CSS** - For beautiful styling

---

## 🔗 Links

- **Figma Design:** [Rami UI](https://www.figma.com/design/jPykGR1A1JsaBUX8YdRxtp/Rami---Untangle-Your-Mind)
- **Documentation:** See `/docs` folder
- **Chrome AI Challenge:** [Details here]

---

**Built with ❤️ for curious minds who love to untangle complexity.**

**Version:** 1.0.0
**Last Updated:** 2025-10-19
**Status:** ✅ Ready for Testing
