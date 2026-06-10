"use client";

/**
 * ThemeToggle — segmented pill control for Auto / Light / Dark.
 *
 * Writes a `data-theme` attribute on <html> (or removes it for "auto").
 * The CSS [data-theme] blocks in components.css pick that up immediately.
 * An active pill slides across the track so state is always visually clear —
 * no label cycling, no ambiguity about which mode is current.
 */

import { useEffect, useState, type MouseEvent } from "react";
import { triggerRipple } from "./ripple";

const RIPPLE_TOGGLE = { strength: 9, size: 90, duration: 600 };

type ThemeMode = "auto" | "light" | "dark";

const MODES: ThemeMode[] = ["auto", "light", "dark"];
const LABELS: Record<ThemeMode, string> = {
  auto: "Auto",
  light: "Light",
  dark: "Dark",
};

function readTheme(): ThemeMode {
  if (typeof document === "undefined") return "auto";
  // The html element is the source of truth — the anti-FOUC script in layout
  // already restored it from localStorage before React hydrated.
  return (
    (document.documentElement.getAttribute("data-theme") as ThemeMode) ?? "auto"
  );
}

function applyTheme(mode: ThemeMode) {
  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
    try {
      localStorage.removeItem("theme");
    } catch {
      /* storage blocked */
    }
  } else {
    document.documentElement.setAttribute("data-theme", mode);
    try {
      localStorage.setItem("theme", mode);
    } catch {
      /* storage blocked */
    }
  }
}

interface Props {
  className?: string;
}

export function ThemeToggle({ className = "" }: Props) {
  const [theme, setTheme] = useState<ThemeMode>("auto");

  // Sync with whatever is on <html> on mount (handles SSR / pre-set themes),
  // and keep in sync with other ThemeToggle instances elsewhere on the page —
  // any of them can change data-theme on <html>, so watch for that.
  useEffect(() => {
    setTheme(readTheme());

    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  function apply(mode: ThemeMode, e: MouseEvent<HTMLButtonElement>) {
    if (mode !== theme) triggerRipple(e.currentTarget, e, RIPPLE_TOGGLE);
    setTheme(mode);
    applyTheme(mode);
  }

  return (
    <div
      className={`theme-toggle glass ${className}`.trim()}
      role="group"
      aria-label="Color theme"
    >
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`glass theme-toggle__opt${theme === mode ? " is-active" : ""}`}
          onClick={(e) => apply(mode, e)}
          aria-pressed={theme === mode}
        >
          {LABELS[mode]}
        </button>
      ))}
    </div>
  );
}
