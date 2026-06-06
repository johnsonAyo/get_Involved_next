"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "theme";

type ThemeMode = "light" | "dark";

function getPreferredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preferredTheme = getPreferredTheme();
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
    
    // Enable transitions after a short delay once the initial state is painted
    const timer = setTimeout(() => {
      setReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  function handleToggle() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <label
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`site-header__theme-toggle checkbox-wrapper-41 ${
        ready ? "site-header__theme-toggle--ready" : ""
      }`.trim()}
    >
      <input
        checked={isDark}
        onChange={handleToggle}
        type="checkbox"
      />
      <span className="sr-only">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </span>
    </label>
  );
}
