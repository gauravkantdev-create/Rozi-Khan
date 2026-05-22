import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, setStoredTheme, themeChangeEvent } from "../utils/theme";

function useThemeMode() {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    const syncTheme = () => setTheme(getStoredTheme());
    window.addEventListener("storage", syncTheme);
    window.addEventListener(themeChangeEvent, syncTheme);

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener(themeChangeEvent, syncTheme);
    };
  }, [theme]);

  const toggleTheme = () => {
    setStoredTheme(theme === "dark" ? "light" : "dark");
  };

  return {
    isDark: theme === "dark",
    theme,
    toggleTheme,
  };
}

export default useThemeMode;
