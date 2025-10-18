/**
 * Theme Management Utilities
 */

export function initializeTheme() {
  const preferences = JSON.parse(localStorage.getItem('preferences') || '{}');
  const theme = preferences.theme || 'light';

  applyTheme(theme);
}

export function applyTheme(theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    root.classList.toggle('dark', systemTheme === 'dark');
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

// Initialize theme on page load
if (typeof document !== 'undefined') {
  initializeTheme();

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const preferences = JSON.parse(localStorage.getItem('preferences') || '{}');
    if (preferences.theme === 'system') {
      applyTheme('system');
    }
  });
}
