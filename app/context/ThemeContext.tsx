"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

type ThemeMode = "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  toggle: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  toggle: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("guilde-theme") as ThemeMode | null;
    if (stored === "light" || stored === "dark") {
      setMode(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setMode("light");
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("guilde-theme", mode);
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode, mounted]);

  const toggle = useCallback(() => {
    setMode(prev => prev === "dark" ? "light" : "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggle, isDark: mode === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
