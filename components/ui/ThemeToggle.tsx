"use client";

/**
 * ThemeToggle — segmented pill control for Light / Dark.
 *
 * Defaults to the user's system color-scheme preference. Clicking a pill
 * sets an explicit `data-theme` attribute on <html> (and mirrors it to
 * localStorage) that overrides the system setting from then on. The CSS
 * [data-theme] blocks in globals.css pick that up immediately.
 */

import { useEffect, useState, type MouseEvent } from "react";
import { triggerRipple } from "./ripple";

const RIPPLE_TOGGLE = { strength: 9, size: 48, duration: 600 };

type Theme = "light" | "dark";

const MODES: Theme[] = ["light", "dark"];
const LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
};

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return systemTheme();
}

function applyTheme(mode: Theme) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    localStorage.setItem("theme", mode);
  } catch {
    /* storage blocked */
  }
}

interface Props {
  className?: string;
}

export function ThemeToggle({ className = "" }: Props) {
  const [theme, setTheme] = useState<Theme>("light");

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

    // Until the user makes an explicit choice, track the system preference
    // so the toggle reflects reality if it changes (e.g. OS switches to
    // dark mode at sunset).
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (!document.documentElement.hasAttribute("data-theme")) {
        setTheme(readTheme());
      }
    };
    media.addEventListener("change", onSystemChange);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", onSystemChange);
    };
  }, []);

  function apply(mode: Theme, e: MouseEvent<HTMLButtonElement>) {
    if (mode !== theme) triggerRipple(e.currentTarget, e, RIPPLE_TOGGLE);
    setTheme(mode);
    applyTheme(mode);
  }

  return (
    <div
      className={`theme-toggle ${className}`.trim()}
      role="group"
      aria-label="Color theme"
    >
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`theme-toggle__opt${theme === mode ? " is-active" : ""}`}
          onClick={(e) => apply(mode, e)}
          aria-pressed={theme === mode}
          aria-label={LABELS[mode]}
        />
      ))}
    </div>
  );
}
