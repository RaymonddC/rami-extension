# 🚀 Setup Guide for AI Reading Studio

Complete setup instructions for developers and users.

---

## 📋 Prerequisites

### Required
- **Google Chrome** version 128 or higher
- **Node.js** version 18 or higher
- **npm** or **yarn** package manager
- **Git** for version control

### Optional (for development)
- **VS Code** or your preferred code editor
- **Chrome DevTools** for debugging
- **React Developer Tools** Chrome extension

---

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/rami-extension.git
cd rami-extension
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 18 + React DOM
- Vite (build tool)
- TailwindCSS + PostCSS + Autoprefixer
- React Flow (mindmap visualization)
- Mermaid (diagram generation)
- Framer Motion (animations)
- Lucide React (icons)
- Zustand (state management)

### 3. Create Extension Icons

You need to add extension icons to the `icons/` folder:

- `icon16.png` - 16x16px
- `icon48.png` - 48x48px
- `icon128.png` - 128x128px

You can:
1. Export them from your Figma design
2. Use an online icon generator
3. Create placeholder icons temporarily

### 4. Build the Extension

#### For Production:
```bash
npm run build
```

This creates a `dist/` folder with the compiled extension.

#### For Development:
```bash
npm run dev
```

This starts a development server with hot-reload.

### 5. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder (or root folder if using dev mode)

---

## ⚙️ Chrome AI Setup

### Enable Chrome AI Features

Chrome AI APIs (Gemini Nano) are experimental. To enable them:

1. Open `chrome://flags/`
2. Search for and enable:
   - **Prompt API for Gemini Nano** → Enabled
   - **Summarization API** → Enabled
   - **Experimental AI APIs** → Enabled
3. Restart Chrome

### Download Gemini Nano Model

After enabling flags:

1. Open DevTools Console
2. Run:
   ```javascript
   await chrome.ai.languageModel.capabilities()
   ```
3. If `available: 'after-download'`, Chrome will download the model
4. Wait for download to complete (may take a few minutes)
5. Verify with:
   ```javascript
   await chrome.ai.languageModel.capabilities()
   // Should return: { available: 'readily' }
   ```

---

## 🎨 Development Workflow

### Project Structure

```
rami-extension/
├── src/
│   ├── background/          # Service worker
│   ├── content/             # Content scripts
│   ├── components/          # React components
│   ├── pages/              # Main pages
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── styles/             # Global styles
├── icons/                  # Extension icons
├── manifest.json           # Extension manifest
└── package.json           # Dependencies
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run watch` - Build and watch for changes

### Development Tips

1. **Hot Reload**: When using `npm run dev`, changes to most files will auto-reload
2. **Background Script Changes**: Require extension reload from `chrome://extensions`
3. **React DevTools**: Install for easier component debugging
4. **Console Errors**: Check both extension popup console AND page console
5. **Storage**: Use `chrome.storage.local` for persistence

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Extension icon appears in Chrome toolbar
- [ ] Popup opens and displays correctly
- [ ] Save current page works
- [ ] Keyboard shortcuts work (Alt+R, Alt+H, Alt+S)
- [ ] Context menu items appear
- [ ] Dashboard opens and displays saved readings
- [ ] Mindmap generation works
- [ ] All three mindmap modes render (React Flow, Mermaid, Hybrid)
- [ ] Persona selection works
- [ ] Theme switching works (Light/Dark/System)
- [ ] Highlights can be created and saved
- [ ] Notes can be added to highlights
- [ ] Storyboard view works
- [ ] Prompt chain editor works

### Test Pages

Test the extension on various websites:
- News articles: https://www.bbc.com/news
- Blog posts: https://medium.com
- Documentation: https://react.dev
- Wikipedia: https://en.wikipedia.org

---

## 🐛 Troubleshooting

### Extension Won't Load

**Problem**: "Manifest file is missing or unreadable"

**Solution**:
- Ensure `manifest.json` exists in the loaded directory
- Check JSON syntax is valid
- Verify all required fields are present

---

### AI APIs Not Working

**Problem**: "chrome.ai is undefined"

**Solution**:
1. Verify Chrome version is 128+
2. Check Chrome flags are enabled
3. Restart Chrome after enabling flags
4. Download Gemini Nano model (see Chrome AI Setup)

---

### Build Errors

**Problem**: "Module not found" or dependency errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

### Icons Not Showing

**Problem**: Extension has no icon or shows default icon

**Solution**:
1. Add proper PNG icons to `icons/` folder
2. Ensure filenames match manifest.json exactly
3. Rebuild extension
4. Reload extension in Chrome

---

### Dark Mode Not Working

**Problem**: Dark mode doesn't apply correctly

**Solution**:
- Check TailwindCSS `darkMode: 'class'` is set
- Verify theme utility is imported
- Clear browser cache
- Check system preferences if using "system" theme

---

## 📦 Building for Distribution

### Chrome Web Store Preparation

1. **Build production version:**
   ```bash
   npm run build
   ```

2. **Test thoroughly:**
   - Load from `dist/` folder
   - Test all features
   - Check console for errors
   - Test on multiple websites

3. **Create ZIP:**
   ```bash
   cd dist
   zip -r ../ai-reading-studio.zip .
   cd ..
   ```

4. **Prepare store listing:**
   - Screenshots (1280x800px or 640x400px)
   - Promotional images (440x280px)
   - Description (from README.md)
   - Privacy policy (if collecting data)

5. **Upload to Chrome Web Store:**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Pay $5 one-time developer fee (if first time)
   - Upload ZIP file
   - Fill in store listing details
   - Submit for review

---

## 🔒 Privacy & Security

### Data Storage

This extension stores data locally using `chrome.storage.local`:
- Saved readings (titles, URLs, content)
- Highlights and notes
- User preferences (persona, theme)
- Generated mindmaps

**No data is sent to external servers.**

### AI Processing

All AI processing happens locally using Gemini Nano:
- Text summarization
- Concept extraction
- Language model queries

**Your content never leaves your device.**

### Permissions

The extension requires these permissions:
- `storage` - Save readings and preferences
- `activeTab` - Access current page for saving
- `contextMenus` - Add right-click menu options
- `tabs` - Get page title and URL
- `scripting` - Inject content scripts

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

Quick start:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/rami-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/rami-extension/discussions)
- **Email**: your.email@example.com

---

## 📚 Additional Resources

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Chrome AI Documentation](https://developer.chrome.com/docs/ai/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [React Flow Documentation](https://reactflow.dev/)
- [Mermaid Documentation](https://mermaid.js.org/)

---

<div align="center">
  <strong>Happy Building! 🚀</strong>
</div>
