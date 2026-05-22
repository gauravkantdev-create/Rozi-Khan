const THEME_KEY = "rozikhan_theme";
const THEME_CHANGE_EVENT = "rozikhan-theme-change";

export const themeChangeEvent = THEME_CHANGE_EVENT;

export const getStoredTheme = () => localStorage.getItem(THEME_KEY) || "dark";

export const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const setStoredTheme = (theme) => {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
};
