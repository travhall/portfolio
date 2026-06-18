"use client";

/**
 * ThemeToggle — single ghost button showing the current theme as a label.
 * Clicking cycles light → dark → light. The label animates out/in with a
 * vertical slide matching the topbar menu toggle label treatment.
 *
 * Uses the sparkle icon from the site's 17-icon set as a visual anchor —
 * it reads as ambient light/energy, appropriate for a theme control without
 * requiring sun/moon glyphs that fall outside the established icon language.
 */

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Icon } from "./Icon";
import { triggerRipple, prefersReducedMotion } from "./ripple";

const RIPPLE_THEME = { strength: 7, size: 60, duration: 500 };

type Theme = "light" | "dark";

const LABELS: Record<Theme, string> = { light: "Light", dark: "Dark" };

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
  const [theme, setTheme]   = useState<Theme>("light");
  const [animDir, setAnimDir] = useState<"in" | "out" | null>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

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
    if (!prefersReducedMotion() && labelRef.current) {
      // Slide out current label, then swap and slide in
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
    if (!prefersReducedMotion()) triggerRipple(e.currentTarget, e, RIPPLE_THEME);
  }

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-pressed={theme === "dark"}
    >
      <Icon name="sparkle" size={14} className="theme-toggle__icon" />
      <span
        ref={labelRef}
        className={[
          "theme-toggle__label",
          animDir === "out" ? "is-exiting" : "",
          animDir === "in"  ? "is-entering" : "",
        ].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {LABELS[theme]}
      </span>
    </button>
  );
}
