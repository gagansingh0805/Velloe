"use client";

import { useState, useEffect } from "react";

/**
 * useTheme - Custom React hook for controlling dark and light mode with localStorage persistence.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("meridian_theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    localStorage.setItem("meridian_theme", theme);
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return { theme, setTheme, toggleTheme, isDark: theme === "dark" };
}

