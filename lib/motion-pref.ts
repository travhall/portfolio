// Manual motion-preference override — mirrors the data-theme pattern in
// ThemeToggle/use-theme: an explicit data-motion attribute on <html> takes
// priority over the OS-level prefers-reduced-motion media query in either
// direction, persisted to localStorage. components/ui/ripple.ts's
// prefersReducedMotion() consults this attribute first.

import { useSyncExternalStore } from "react";

export type MotionPref = "on" | "off";

function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function readMotionPref(): MotionPref {
  if (typeof document === "undefined") return "on";
  const explicit = document.documentElement.getAttribute("data-motion");
  if (explicit === "on" || explicit === "off") return explicit;
  return systemPrefersReducedMotion() ? "off" : "on";
}

export function applyMotionPref(pref: MotionPref) {
  document.documentElement.setAttribute("data-motion", pref);
  try {
    localStorage.setItem("motion", pref);
  } catch {
    /* blocked */
  }
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-motion"],
  });

  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);

  function onStorage(e: StorageEvent) {
    if (e.key !== "motion") return;
    if (e.newValue === "on" || e.newValue === "off") {
      document.documentElement.setAttribute("data-motion", e.newValue);
    } else if (e.newValue === null) {
      document.documentElement.removeAttribute("data-motion");
    }
  }
  window.addEventListener("storage", onStorage);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): MotionPref {
  return "on";
}

/** Reactive read of the resolved motion preference — for components (e.g.
 *  FeatureWipe) that stay mounted across a Menu-driven toggle and need to
 *  re-run their own setup, not just re-render. useSyncExternalStore makes
 *  this hydration-safe: React guarantees the first client render matches
 *  getServerSnapshot, then resyncs to the real value right after hydration. */
export function useMotionPref(): MotionPref {
  return useSyncExternalStore(subscribe, readMotionPref, getServerSnapshot);
}
