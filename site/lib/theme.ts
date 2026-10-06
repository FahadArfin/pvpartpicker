export type Theme = 'dark' | 'light';
export const themeStorageKey = 'pvpartpicker-theme';
export function normalizeTheme(value: unknown): Theme {
  return value === 'light' ? 'light' : 'dark';
}
// Runs before paint so full-page navigation keeps the visitor's selected theme.
// Keep this dependency-free and in sync with normalizeTheme.
export const themeBootstrap = `(function(){var t='dark';try{if(localStorage.getItem('${themeStorageKey}')==='light')t='light';}catch(e){}document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');})();`;
