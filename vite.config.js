import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, cpSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-files',
      closeBundle() {
        // Copy manifest
        copyFileSync('manifest.json', 'dist/manifest.json');

        // Create directories
        mkdirSync('dist/src/background', { recursive: true });
        mkdirSync('dist/src/content', { recursive: true });
        mkdirSync('dist/icons', { recursive: true });

        // Copy background script
        copyFileSync('src/background/background.js', 'dist/src/background/background.js');

        // Copy content scripts
        copyFileSync('src/content/reader.js', 'dist/src/content/reader.js');
        copyFileSync('src/content/reader.css', 'dist/src/content/reader.css');

        // Copy icons folder
        if (existsSync('icons')) {
          cpSync('icons', 'dist/icons', { recursive: true });
        }

        console.log('✅ Extension files copied successfully!');
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        options: resolve(__dirname, 'options.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
