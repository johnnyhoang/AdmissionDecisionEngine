export type AppTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'app-theme';
export const LEGACY_THEME_STORAGE_KEY = 'grade10-theme';

export const readStoredTheme = (): AppTheme => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) ?? localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const writeStoredTheme = (theme: AppTheme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures and keep the in-memory theme.
  }

  window.dispatchEvent(new CustomEvent<AppTheme>('app-theme-change', { detail: theme }));
};

export const applyThemeToDocument = (theme: AppTheme) => {
  if (typeof document === 'undefined') return;

  const isLight = theme === 'light';
  const root = document.documentElement;
  const body = document.body;

  root.classList.toggle('light-theme', isLight);
  root.classList.toggle('dark-theme', !isLight);
  body.classList.toggle('light-theme', isLight);
  body.classList.toggle('dark-theme', !isLight);
  root.dataset.theme = theme;
  body.dataset.theme = theme;
  root.style.colorScheme = theme;
  body.style.colorScheme = theme;
};
