const THEME_KEY = "rozikhan_theme";
const THEME_CHANGE_EVENT = "rozikhan-theme-change";

export const themeChangeEvent = THEME_CHANGE_EVENT;

const safeGetItem = (key) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key, value) => {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const getStoredTheme = () => {
  const storedTheme = safeGetItem(THEME_KEY);
  if (storedTheme) return storedTheme;

  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
};

export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const setStoredTheme = (theme) => {
  safeSetItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
};
