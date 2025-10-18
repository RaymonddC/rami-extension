# 🔧 Fix: MIME Type Error

## The Problem

You're getting: `Expected a JavaScript module but server responded with MIME type "application/octet-stream"`

This happens because you're trying to load the extension BEFORE building it with Vite.

---

## ✅ Solution (2 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build the Extension

```bash
npm run build
```

This creates a `dist/` folder with compiled files.

### Step 3: Load the DIST Folder

1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. **Select the `dist` folder** (NOT the root folder)

---

## 🎨 Before Building: Add Icons

Create these 3 files in the `icons/` folder:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can create simple placeholders or use an online generator.

### Quick Placeholder Icons

For testing, you can create simple colored squares using any image editor or online tool like:
- https://www.favicon-generator.org/
- https://onlinepngtools.com/create-blank-png

---

## 🚨 Common Mistakes

❌ **Wrong**: Loading the root folder directly
✅ **Correct**: Building first, then loading the `dist` folder

❌ **Wrong**: Running the extension without `npm run build`
✅ **Correct**: Always build before loading

---

## 📝 Complete Build Process

```bash
# 1. Navigate to project
cd /mnt/d/raymond/Documents/DESKTOP/Projects/rami-extension

# 2. Install (first time only)
npm install

# 3. Add icons to icons/ folder (required)
# Create icon16.png, icon48.png, icon128.png

# 4. Build
npm run build

# 5. Load in Chrome
# chrome://extensions/ → Developer mode → Load unpacked → Select "dist" folder
```

---

## 🔄 Development Workflow

### For Quick Changes:
```bash
# Make your changes to source files
npm run build
# Reload extension in Chrome (click reload icon)
```

### For Active Development:
```bash
npm run watch
# Automatically rebuilds on file changes
# Still need to manually reload extension in Chrome
```

---

## 🐛 Still Having Issues?

### Clear the Build

```bash
rm -rf dist node_modules
npm install
npm run build
```

### Check Vite Version

Make sure you have Node.js 18+ and npm 9+:
```bash
node --version  # Should be v18 or higher
npm --version   # Should be 9 or higher
```

### Manifest Errors

If you see "Manifest file is missing":
- Make sure `dist/manifest.json` exists after building
- Check that all paths in manifest.json are correct

---

## ✅ Success Checklist

After `npm run build`, you should have:

```
dist/
├── index.html          ✅
├── dashboard.html      ✅
├── options.html        ✅
├── manifest.json       ✅
├── assets/            ✅
│   ├── popup.js
│   ├── dashboard.js
│   ├── options.js
│   └── index.css
└── icons/             ✅
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

If the `dist` folder looks like this, you're ready to load it in Chrome!

---

## 🎯 Quick Test

After loading the extension:

1. **Check toolbar**: Extension icon should appear
2. **Click icon**: Popup should open
3. **Open console**: No errors should appear
4. **Test feature**: Try "Save Current Page"

If all these work, you're good to go! 🚀
