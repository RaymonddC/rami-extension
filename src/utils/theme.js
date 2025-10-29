/**
 * Enhanced Theme Management for Chrome Extension
 * Ensures theme applies consistently across ALL pages
 */

// Apply theme to document
export function applyTheme(theme) {
    const root = document.documentElement;

    if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
        console.log('✅ Applied system theme:', systemTheme);
    } else {
        root.classList.toggle('dark', theme === 'dark');
        console.log('✅ Applied theme:', theme);
    }
}

// Initialize theme on page load
export function initializeTheme() {
    console.log('🎨 Initializing theme...');

    if (typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome extension environment
        chrome.storage.local.get('preferences', (result) => {
            const theme = result.preferences?.theme || 'light';
            console.log('📖 Loaded theme from storage:', theme);
            applyTheme(theme);
        });

        // Listen for storage changes (syncs across all pages)
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.preferences) {
                const newTheme = changes.preferences.newValue?.theme;
                if (newTheme) {
                    console.log('🔄 Theme changed in storage:', newTheme);
                    applyTheme(newTheme);
                }
            }
        });

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = () => {
            chrome.storage.local.get('preferences', (result) => {
                if (result.preferences?.theme === 'system') {
                    console.log('🌓 System theme changed');
                    applyTheme('system');
                }
            });
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);
    }
}

// Force immediate theme application (for React apps)
export function forceThemeUpdate() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get('preferences', (result) => {
            const theme = result.preferences?.theme || 'light';
            applyTheme(theme);
        });
    }
}

// Auto-initialize on page load
if (typeof document !== 'undefined') {
    // Apply immediately to prevent flash
    initializeTheme();

    // Also apply after DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceThemeUpdate);
    } else {
        forceThemeUpdate();
    }
}