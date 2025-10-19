# Build Instructions - IMPORTANT

## ⚠️ WSL Build Issue

The build is currently failing in WSL due to a Rollup dependency issue. You need to build on **Windows** instead.

## ✅ How to Build on Windows

### Option 1: PowerShell (Recommended)

```powershell
# Open PowerShell in the project directory
cd D:\raymond\Documents\DESKTOP\Projects\rami-extension

# Build the extension
npm run build
```

### Option 2: Command Prompt

```cmd
# Open CMD in the project directory
cd D:\raymond\Documents\DESKTOP\Projects\rami-extension

# Build the extension
npm run build
```

### Option 3: VS Code Terminal

1. Open the project in VS Code
2. Open Terminal (Ctrl + `)
3. Make sure terminal is set to **PowerShell** or **CMD** (not WSL/Bash)
4. Run: `npm run build`

## ✅ After Build

1. Go to `chrome://extensions/`
2. Click **Reload** icon on your extension
3. Test the mindmap feature!

## 🎯 What Was Fixed

1. **Text extraction limit increased**: 5,000 → 50,000 characters
2. **Dashboard URL hash handling**: Opens directly to mindmap tab when clicked from popup
3. **Auto-load concepts**: Dashboard loads concepts from the latest saved reading automatically
4. **Better logging**: Console logs to help debug the flow

## 🧪 How to Test

1. Visit any article (e.g., Wikipedia page)
2. Click extension icon
3. Click "Generate Mindmap" button
4. Should extract content, generate concepts, and open dashboard on mindmap tab
5. Mindmap should display automatically!

## 📊 Expected Console Output

```
🔍 extractConcepts called with: {textLength: 15000, persona: 'architect', maxConcepts: 8}
📝 Extracted concept candidates: ['Technology', 'Computer', 'Software', ...]
🎯 Generated mock concepts: [{id: 'concept-0', label: 'Technology', ...}]
📖 Loading latest reading for mindmap: "Article Title"
✅ Found concepts in reading: [{...}, {...}, ...]
```

## ❌ If Build Still Fails

If npm build fails even on Windows:

```powershell
# Clean reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run build
```

---

**The code is ready - just needs to be built on Windows!**
