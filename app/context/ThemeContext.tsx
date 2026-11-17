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
    const initial: ThemeMode = stored === "light" || stored === "dark" ? stored : window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    // L'attribut est posé tout de suite (pas de flash) ; l'état React suit juste après.
    document.documentElement.setAttribute("data-theme", initial);
    void Promise.resolve().then(() => { setMode(initial); setMounted(true); });
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
