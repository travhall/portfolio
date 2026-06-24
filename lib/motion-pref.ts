// Manual motion-preference override — mirrors the data-theme pattern in
// ThemeToggle/use-theme: an explicit data-motion attribute on <html> takes
// priority over the OS-level prefers-reduced-motion media query in either
// direction, persisted to localStorage. components/ui/ripple.ts's
// prefersReducedMotion() consults this attribute first.

import { useEffect, useState } from "react";

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

/** Reactive read of the resolved motion preference — for components (e.g.
 *  FeatureWipe) that stay mounted across a Menu-driven toggle and need to
 *  re-run their own setup, not just re-render. */
export function useMotionPref(): MotionPref {
  const [pref, setPref] = useState<MotionPref>(() =>
    typeof document === "undefined" ? "on" : readMotionPref()
  );

  useEffect(() => {
    const observer = new MutationObserver(() => setPref(readMotionPref()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-motion"],
    });

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onSystem = () => {
      if (!document.documentElement.hasAttribute("data-motion")) {
        setPref(readMotionPref());
      }
    };
    media.addEventListener("change", onSystem);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", onSystem);
    };
  }, []);

  return pref;
}
