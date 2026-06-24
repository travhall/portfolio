"use client";

/**
 * ThemeToggle — single ghost button cycling light ↔ dark.
 *
 * The SunMoonIcon animates imperatively (via ref) before React re-renders
 * so the transition runs from the current visual state, not the post-swap
 * snapshot. The text label slides up/down independently.
 */

import { useRef, type MouseEvent } from "react";
import { SunMoonIcon, type SunMoonHandle } from "./SunMoonIcon";
import { triggerRipple, prefersReducedMotion } from "./ripple";
import { useTogglePillAnimation } from "./useTogglePillAnimation";
import { useTheme, type Theme } from "@/lib/use-theme";

const RIPPLE_THEME = { strength: 7, size: 60, duration: 500 };

function applyTheme(mode: Theme) {
  document.documentElement.setAttribute("data-theme", mode);
  try { localStorage.setItem("theme", mode); } catch { /* blocked */ }
}

interface Props { className?: string; }

export function ThemeToggle({ className = "" }: Props) {
  const theme = useTheme();
  const { animDir, labelRef, runToggle } = useTogglePillAnimation();
  const iconRef = useRef<SunMoonHandle>(null);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const next: Theme = theme === "light" ? "dark" : "light";
    const reduced = prefersReducedMotion();

    // Fire icon morph immediately — runs from current DOM state
    if (!reduced) iconRef.current?.animate(next === "dark");

    runToggle(reduced, () => applyTheme(next));

    if (!reduced) triggerRipple(e.currentTarget, e, RIPPLE_THEME);
  }

  return (
    <button
      type="button"
      className={`toggle-pill ${className}`.trim()}
      onClick={toggle}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      aria-pressed={theme === "dark"}
    >
      <SunMoonIcon ref={iconRef} size={16} />
      <span
        ref={labelRef}
        className={[
          "toggle-pill__label",
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
