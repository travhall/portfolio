import { describe, expect, it } from "vitest";
import { resolveThemeVars, type CaseStudyTheme } from "./case-study-theme";

describe("resolveThemeVars", () => {
  it("returns undefined when no theme is set", () => {
    expect(resolveThemeVars(undefined)).toBeUndefined();
  });

  it("reuses light mode's values when dark is omitted", () => {
    const theme: CaseStudyTheme = { light: { bg: "#fff", fg: "#000" } };
    const vars = resolveThemeVars(theme);
    expect(vars?.["--cs-bg"]).toBe("light-dark(#fff, #fff)");
    expect(vars?.["--cs-fg"]).toBe("light-dark(#000, #000)");
  });

  it("uses distinct dark-mode values when provided", () => {
    const theme: CaseStudyTheme = {
      light: { bg: "#fff", fg: "#000" },
      dark: { bg: "#111", fg: "#eee" },
    };
    const vars = resolveThemeVars(theme);
    expect(vars?.["--cs-bg"]).toBe("light-dark(#fff, #111)");
    expect(vars?.["--cs-fg"]).toBe("light-dark(#000, #eee)");
  });

  it("derives border as a 50% color-mix when unset", () => {
    const theme: CaseStudyTheme = { light: { bg: "#fff", fg: "#000" } };
    const vars = resolveThemeVars(theme);
    expect(vars?.["--cs-border"]).toBe(
      "light-dark(color-mix(in oklab, #000 50%, #fff), color-mix(in oklab, #000 50%, #fff))",
    );
  });

  it("uses an explicit border when set, not the derived color-mix", () => {
    const theme: CaseStudyTheme = {
      light: { bg: "#fff", fg: "#000", border: "#ccc" },
    };
    const vars = resolveThemeVars(theme);
    expect(vars?.["--cs-border"]).toBe("light-dark(#ccc, #ccc)");
  });

  it("falls back accentText -> accent -> fg in order", () => {
    const fgOnly: CaseStudyTheme = { light: { bg: "#fff", fg: "#000" } };
    expect(resolveThemeVars(fgOnly)?.["--cs-accent-text"]).toBe(
      "light-dark(#000, #000)",
    );

    const withAccent: CaseStudyTheme = {
      light: { bg: "#fff", fg: "#000", accent: "#f00" },
    };
    expect(resolveThemeVars(withAccent)?.["--cs-accent-text"]).toBe(
      "light-dark(#f00, #f00)",
    );

    const withAccentText: CaseStudyTheme = {
      light: { bg: "#fff", fg: "#000", accent: "#f00", accentText: "#900" },
    };
    expect(resolveThemeVars(withAccentText)?.["--cs-accent-text"]).toBe(
      "light-dark(#900, #900)",
    );
  });

  it("derives button colors from accent/bg when button is unset", () => {
    const theme: CaseStudyTheme = {
      light: { bg: "#fff", fg: "#000", accent: "#f00" },
    };
    const vars = resolveThemeVars(theme);
    expect(vars?.["--cs-button-bg"]).toBe("light-dark(#f00, #f00)"); // derivedAccent
    expect(vars?.["--cs-button-fg"]).toBe("light-dark(#fff, #fff)"); // mode.bg
    expect(vars?.["--cs-button-border"]).toBe("light-dark(#f00, #f00)"); // derivedButtonBg
  });

  it("uses explicit button colors when set, not derived ones", () => {
    const theme: CaseStudyTheme = {
      light: {
        bg: "#fff",
        fg: "#000",
        accent: "#f00",
        button: { bg: "#900", fg: "#fff", border: "#600" },
      },
    };
    const vars = resolveThemeVars(theme);
    expect(vars?.["--cs-button-bg"]).toBe("light-dark(#900, #900)");
    expect(vars?.["--cs-button-fg"]).toBe("light-dark(#fff, #fff)");
    expect(vars?.["--cs-button-border"]).toBe("light-dark(#600, #600)");
  });
});
