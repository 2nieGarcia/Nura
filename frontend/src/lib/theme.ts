export type ThemeMode = "light" | "dark";

const THEME_KEY = "nura.theme";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark";
}

export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (isThemeMode(stored)) return stored;
  } catch {
    // Keep light mode when storage is unavailable.
  }

  return "light";
}

export function saveStoredTheme(theme: ThemeMode): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Keep the in-memory theme even if localStorage is unavailable.
  }
}

export function applyTheme(theme: ThemeMode): void {
  document.documentElement.dataset.theme = theme;
}
