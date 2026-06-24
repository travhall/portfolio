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

function getSnapshot(): Theme {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
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
