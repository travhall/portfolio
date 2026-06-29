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
import { useTogglePillAnimation } from "./useTogglePillAnimation";
import { useTheme, type Theme } from "@/lib/use-theme";

const RIPPLE_THEME = { strength: 7, size: 60, duration: 500 };

function applyTheme(mode: Theme) {
  document.documentElement.setAttribute("data-theme", mode);
  try { localStorage.setItem("theme", mode); } catch { /* blocked */ }
}

interface Props { className?: string; }

export function ThemeToggle({ className = "" }: Props) {
  const observedTheme = useTheme();
  const [theme, setTheme] = useState<Theme>(observedTheme);
  const { animDir, labelRef, runToggle } = useTogglePillAnimation();
  const iconRef = useRef<SunMoonHandle>(null);

  // pendingRef tracks the in-flight click's target value synchronously — see
  // the identical pattern (and its rationale) in MotionToggle.tsx.
  const pendingRef = useRef<Theme | null>(null);

  // Re-sync from the hook (an external change — OS preference, dev tools,
  // another tab) only when no click-driven toggle is in flight.
  useEffect(() => {
    if (pendingRef.current === null) {
      setTheme(observedTheme);
    }
  }, [observedTheme]);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const current = pendingRef.current ?? theme;
    const next: Theme = current === "light" ? "dark" : "light";
    pendingRef.current = next;
    const reduced = prefersReducedMotion();

    // Fire icon morph immediately — runs from current DOM state
    if (!reduced) iconRef.current?.animate(next === "dark");

    runToggle(reduced, () => {
      if (pendingRef.current !== next) return; // superseded by a later click
      setTheme(next);
      applyTheme(next);
      pendingRef.current = null;
    });

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
