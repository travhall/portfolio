"use client";

// Reactive read of the resolved light/dark theme — data-theme attribute,
// falling back to system preference — so any component can key visuals
// (brand colors, dark mode images, the theme toggle itself) off the same
// source of truth. useSyncExternalStore is what makes this hydration-safe:
// React itself guarantees the first client render matches getServerSnapshot
// (the SSR default), then resyncs to the real value right after hydration —
// no manual effect bookkeeping, no suppressHydrationWarning.

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";

// Exported separately from the hook: imperative effects that pick a WebGL
// texture src (FeatureWipe, AboutPortrait) must use this directly rather
// than the `theme` value useTheme() returns at render time. The DOM
// attribute is already correct on the very first paint (the anti-FOUC
// script in app/layout.tsx runs beforeInteractive, before React touches
// anything) — but useTheme()'s React-state value can still be one render
// behind that on the very first mount (getServerSnapshot must lie and say
// "light" to satisfy the hydration-matching contract). Reading the DOM
// directly sidesteps that React-timing question entirely for code that
// only needs the value once, at execution time — not for reactivity.
export function resolveTheme(): Theme {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSnapshot(): Theme {
  return resolveTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);

  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
