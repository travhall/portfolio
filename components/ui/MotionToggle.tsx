"use client";

/**
 * MotionToggle — single ghost button cycling motion on ↔ off. Same pill
 * shape and label-slide animation as ThemeToggle (see lib/motion-pref.ts
 * for the data-motion override this writes/reads).
 *
 * The toggle's own click ripple is gated on the *current* (pre-toggle)
 * preference, same as ThemeToggle — so switching motion off still plays
 * the ripple for this one click, and switching it on plays one too.
 */

import { useEffect, useRef, type MouseEvent } from "react";
import { Icon } from "./Icon";
import { triggerRipple, prefersReducedMotion } from "./ripple";
import { applyMotionPref, useMotionPref, type MotionPref } from "@/lib/motion-pref";
import { useTogglePillAnimation } from "./useTogglePillAnimation";
import { useState } from "react";

const RIPPLE_MOTION = { strength: 7, size: 60, duration: 500 };

interface Props { className?: string; }

export function MotionToggle({ className = "" }: Props) {
  const observedPref = useMotionPref();
  const [pref, setPref] = useState<MotionPref>(observedPref);
  const { animDir, labelRef, runToggle } = useTogglePillAnimation();

  // pendingRef tracks the in-flight click's target value synchronously, so a
  // second click before the first's animation settles reads the *intended*
  // value rather than a stale `pref` from the render that's still in flight —
  // and so a superseded commit (one a later click has already overridden)
  // skips applying its now-stale value instead of briefly flashing it.
  // Refs must not be read during render (React rules-of-refs), so the
  // re-sync check below lives in an effect, not inline in the render body.
  const pendingRef = useRef<MotionPref | null>(null);

  // Re-sync from the hook (an external change — OS preference, dev tools,
  // another tab) only when no click-driven toggle is in flight.
  useEffect(() => {
    if (pendingRef.current === null) {
      setPref(observedPref);
    }
  }, [observedPref]);

  function toggle(e: MouseEvent<HTMLButtonElement>) {
    const current = pendingRef.current ?? pref;
    const next: MotionPref = current === "on" ? "off" : "on";
    pendingRef.current = next;
    const reduced = prefersReducedMotion();

    runToggle(reduced, () => {
      if (pendingRef.current !== next) return; // superseded by a later click
      setPref(next);
      applyMotionPref(next);
      pendingRef.current = null;
    });

    if (!reduced) triggerRipple(e.currentTarget, e, RIPPLE_MOTION);
  }

  return (
    <button
      type="button"
      className={`toggle-pill ${className}`.trim()}
      onClick={toggle}
      aria-label={`Turn motion ${pref === "on" ? "off" : "on"}`}
      aria-pressed={pref === "off"}
    >
      <span className="toggle-pill__icon">
        <Icon name="motion" size={16} />
      </span>
      <span
        ref={labelRef}
        className={[
          "toggle-pill__label",
          "toggle-pill__label--wide",
          animDir === "out" ? "is-exiting" : "",
          animDir === "in"  ? "is-entering" : "",
        ].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {pref === "on" ? "Motion On" : "Motion Off"}
      </span>
    </button>
  );
}
