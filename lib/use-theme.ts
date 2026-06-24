"use client";

// Reactive read of the resolved light/dark theme, mirroring the detection
// logic ThemeToggle uses (data-theme attribute, falling back to system
// preference) so other components can key visuals — brand colors, dark
// mode images — off the same source of truth.

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function resolveTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document === "undefined" ? "light" : resolveTheme()
  );

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(resolveTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystem = () => {
      if (!document.documentElement.hasAttribute("data-theme")) {
        setTheme(resolveTheme());
      }
    };
    media.addEventListener("change", onSystem);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", onSystem);
    };
  }, []);

  return theme;
}
