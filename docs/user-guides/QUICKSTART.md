# ⚡ Quick Start Guide

Get AI Reading Studio running in 5 minutes!

---

## 🎯 What You'll Build

A Chrome extension that:
- ✅ Saves web articles for offline reading
- ✅ Summarizes content using Gemini Nano
- ✅ Generates interactive mindmaps
- ✅ Highlights and annotates text
- ✅ Creates visual storyboards

---

## 🚀 Installation (3 Steps)

### Step 1: Install & Build

```bash
# Clone and navigate
git clone https://github.com/yourusername/rami-extension.git
cd rami-extension

# Install dependencies
npm install

# Build the extension
npm run build
```

### Step 2: Add to Chrome

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Step 3: Enable AI Features

1. Go to `chrome://flags/`
2. Enable these flags:
   - **Prompt API for Gemini Nano** → Enabled
   - **Summarization API** → Enabled
3. Restart Chrome

---

## 🎮 Try It Out

### Test #1: Save a Page

1. Visit any article (try: https://www.bbc.com/news)
2. Click the extension icon
3. Click "Save Current Page"
4. Check the dashboard

### Test #2: Generate a Mindmap

1. Open Dashboard (click icon → "Open Dashboard")
2. Select a saved reading
3. Switch to "Mindmap" tab
4. Click "Generate Mindmap"

### Test #3: Use Keyboard Shortcuts

While on any webpage:
- Press `Alt + H` → Highlight selected text
- Press `Alt + S` → Summarize selection

---

## 🎨 Choose Your Persona

The extension adapts to your thinking style:

- **☕ Strategist**: Balanced, thoughtful analysis
- **🧊 Analyst**: Direct, efficient summaries
- **🧱 Architect**: Structured, systematic
- **⚡ Researcher**: Deep, thorough exploration
- **🌿 Mentor**: Gentle, patient guidance

Change persona in: Dashboard → Settings or Popup header

---

## 🧪 Test Features

### Mindmap Modes

1. **React Flow**: Drag, zoom, edit nodes
2. **Mermaid**: Export as code
3. **Hybrid**: Both views side-by-side

Switch modes in Dashboard → Mindmap tab

### Storyboard

1. Generate a mindmap
2. Go to "Storyboard" tab
3. Navigate frames with arrows

### Prompt Chains

1. Go to "Prompts" tab
2. Click "Add Step"
3. Build reasoning flows:
   - Summarize → Extract → Visualize → Reflect

---

## 🐛 Troubleshooting

### Extension Won't Load

**Error**: Manifest file missing

**Fix**: Make sure you selected the `dist/` folder, not the root folder.

---

### AI Not Working

**Error**: `chrome.ai is undefined`

**Fix**:
1. Chrome version 128+ required
2. Enable flags at `chrome://flags`
3. Restart Chrome
4. Wait for Gemini Nano to download (check console)

---

### No Icons

**Error**: Extension shows default gray icon

**Fix**: Add PNG icons to `icons/` folder:
- icon16.png (16x16px)
- icon48.png (48x48px)
- icon128.png (128x128px)

Then rebuild: `npm run build`

---

## 📚 Next Steps

1. **Read**: Check [README.md](README.md) for full features
2. **Setup**: See [SETUP.md](SETUP.md) for detailed instructions
3. **Customize**: Edit personas in `src/utils/summarize.js`
4. **Design**: Import your own Figma designs
5. **Deploy**: Package for Chrome Web Store

---

## 💡 Pro Tips

### Keyboard Power User

Learn all shortcuts:
- `Alt + H` - Highlight
- `Alt + S` - Summarize
- `Ctrl + Click on highlight` - Remove highlight

### Best Practices

1. **Save articles**: Build your reading library first
2. **Pick persona**: Choose before generating mindmaps
3. **Use chains**: Combine multiple AI steps for deeper insights
4. **Export**: Use Mermaid mode to export diagrams as code
5. **Annotate**: Add notes to highlights for future reference

### Performance

- Summarization works **offline** with Gemini Nano
- First summary may be slow (model initialization)
- Subsequent summaries are fast
- Storage is unlimited (Chrome local storage)

---

## 🎓 Learning Path

### Week 1: Basic Usage
- Save 10 articles
- Try all 5 personas
- Generate 5 mindmaps

### Week 2: Advanced Features
- Create highlight library
- Build prompt chains
- Make storyboards

### Week 3: Customize
- Modify personas
- Adjust UI colors
- Add custom shortcuts

---

## 📞 Get Help

- **Issues**: Open on [GitHub Issues](https://github.com/yourusername/rami-extension/issues)
- **Questions**: Ask in [Discussions](https://github.com/yourusername/rami-extension/discussions)
- **Updates**: Watch repository for new features

---

## ✅ Checklist

Use this to verify everything works:

- [ ] Extension installed and visible
- [ ] Popup opens correctly
- [ ] Can save current page
- [ ] Dashboard displays saved readings
- [ ] Can generate mindmap
- [ ] All 3 mindmap modes work
- [ ] Can switch personas
- [ ] Keyboard shortcuts work
- [ ] Can highlight text
- [ ] Can add notes
- [ ] Theme switching works
- [ ] Storyboard view works
- [ ] Prompt chain editor works

---

<div align="center">
  <strong>🎉 You're all set! Start reading smarter.</strong>
  <br><br>
  <sub>Need help? Check <a href="SETUP.md">SETUP.md</a> or <a href="README.md">README.md</a></sub>
</div>
