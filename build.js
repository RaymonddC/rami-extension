import { build } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const __dirname = new URL('.', import.meta.url).pathname;

async function buildExtension() {
  console.log('🔨 Building Rami...\n');

  // Build React pages
  console.log('📦 Building React pages...');
  await build({
    configFile: false,
    build: {
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'index.html'),
          options: resolve(__dirname, 'options.html'),
          dashboard: resolve(__dirname, 'dashboard.html'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name].[ext]'
        }
      },
      outDir: 'dist',
    }
  });

  // Create directories
  console.log('📁 Creating directories...');
  mkdirSync('dist/src/background', { recursive: true });
  mkdirSync('dist/src/content', { recursive: true });
  mkdirSync('dist/src/utils', { recursive: true });
  mkdirSync('dist/icons', { recursive: true });

  // Copy manifest
  console.log('📋 Copying manifest...');
  copyFileSync('manifest.json', 'dist/manifest.json');

  // Copy background script
  console.log('🔧 Copying background script...');
  copyFileSync('src/background/background.js', 'dist/src/background/background.js');

  // Copy content scripts
  console.log('📝 Copying content scripts...');
  copyFileSync('src/content/reader.js', 'dist/src/content/reader.js');
  copyFileSync('src/content/reader.css', 'dist/src/content/reader.css');

  // Copy utils (needed by background script)
  console.log('🔧 Copying utils...');
  copyFileSync('src/utils/summarize.js', 'dist/src/utils/summarize.js');

  // Copy icons if they exist
  console.log('🎨 Copying icons...');
  ['icon16.png', 'icon48.png', 'icon128.png'].forEach(icon => {
    const iconPath = `icons/${icon}`;
    if (existsSync(iconPath)) {
      copyFileSync(iconPath, `dist/icons/${icon}`);
    } else {
      console.log(`⚠️  Warning: ${icon} not found - you'll need to add this`);
    }
  });

  console.log('\n✅ Build complete! Load the "dist" folder in Chrome.');
  console.log('📍 chrome://extensions/ → Developer mode → Load unpacked\n');
}

buildExtension().catch(console.error);
