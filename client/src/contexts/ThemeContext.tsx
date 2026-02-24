import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "dark-blue" | "all-black" | "iron-man";
type DarkTheme = Exclude<Theme, "light">;

const THEMES: Theme[] = ["light", "dark", "dark-blue", "all-black", "iron-man"];
const DARK_THEME_CLASSES: Theme[] = ["dark", "dark-blue", "all-black", "iron-man"];
const LAST_DARK_THEME_KEY = "last_dark_theme";

interface ThemeContextType {
  theme: Theme;
  setTheme?: (theme: Theme) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const resolvedDefaultTheme: Theme = THEMES.includes(defaultTheme) ? defaultTheme : "light";

  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      if (stored && THEMES.includes(stored as Theme)) {
        return stored as Theme;
      }
    }
    return resolvedDefaultTheme;
  });
  const [lastDarkTheme, setLastDarkTheme] = useState<DarkTheme>(() => {
    const stored = localStorage.getItem(LAST_DARK_THEME_KEY);
    if (stored && stored !== "light" && THEMES.includes(stored as Theme)) {
      return stored as DarkTheme;
    }
    if (resolvedDefaultTheme !== "light") return resolvedDefaultTheme;
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove(...DARK_THEME_CLASSES);
    if (theme !== "light") root.classList.add(theme);

    if (theme !== "light") {
      setLastDarkTheme(theme);
      localStorage.setItem(LAST_DARK_THEME_KEY, theme);
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? lastDarkTheme : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, setTheme: switchable ? setTheme : undefined, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
