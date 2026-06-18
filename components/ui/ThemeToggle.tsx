"use client";

/**
 * ThemeToggle — single ghost button cycling light ↔ dark.
 *
 * The SunMoonIcon animates imperatively (via ref) before React re-renders
 * so the transition runs from the current visual state, not the post-swap
 * snapshot. The text label slides up/down independently.
 */

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { SunMoonIcon, type SunMoonHandle } from "./SunMoonIcon";
import { triggerRipple, prefersReducedMotion } from "./ripple";

const RIPPLE_THEME = { strength: 7, size: 60, duration: 500 };

type Theme = "light" | "dark";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function readTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return systemTheme();
}

function applyTheme(mode: Theme) {
  document.documentElement.setAttribute("data-theme", mode);
  try { localStorage.setItem("theme", mode); } catch { /* blocked */ }
}

interface Props { className?: string; }

export function ThemeToggle({ className = "" }: Props) {
  const [theme, setTheme]     = useState<Theme>("light");
  const [animDir, setAnimDir] = useState<"in" | "out" | null>(null);
  const labelRef  = useRef<HTMLSpanElement>(null);
  const iconRef   = useRef<SunMoonHandle>(null);

  useEffect(() => {
    setTheme(readTheme());
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (!document.documentElement.hasAttribute("data-theme")) setTheme(readTheme());
    };
    media.addEventListener("change", onSystem);
    return () => { observer.disconnect(); media.removeEventListener("change", onSystem); };
  }, []);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const next: Theme = theme === "light" ? "dark" : "light";
    const reduced = prefersReducedMotion();

    // Fire icon morph immediately — runs from current DOM state
    if (!reduced) iconRef.current?.animate(next === "dark");

    if (!reduced && labelRef.current) {
      setAnimDir("out");
      setTimeout(() => {
        setTheme(next);
        applyTheme(next);
        setAnimDir("in");
        setTimeout(() => setAnimDir(null), 280);
      }, 160);
    } else {
      setTheme(next);
      applyTheme(next);
    }

    if (!reduced) triggerRipple(e.currentTarget, e, RIPPLE_THEME);
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-pressed={theme === "dark"}
    >
      <SunMoonIcon ref={iconRef} dark={theme === "dark"} size={16} />
      <span
        ref={labelRef}
        className={[
          "theme-toggle__label",
          animDir === "out" ? "is-exiting" : "",
          animDir === "in"  ? "is-entering" : "",
        ].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
