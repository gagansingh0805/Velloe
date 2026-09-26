"use client";

import { useState, useEffect } from "react";

/**
 * useTheme - Custom React hook for controlling dark and light mode with localStorage persistence.
 */
export function useTheme() {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("meridian_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        const root = document.documentElement;
        if (savedTheme === "light") {
          root.classList.remove("dark");
          root.classList.add("light");
        } else {
          root.classList.remove("light");
          root.classList.add("dark");
        }
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem("meridian_theme", theme);
    } catch (e) {}
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, setTheme, toggleTheme, isDark: theme === "dark", mounted };
}

