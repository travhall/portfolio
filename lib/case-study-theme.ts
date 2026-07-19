// case-study-theme.ts — resolves a case study's real per-project palette
// (sampled from its own live site/repo, not derived from a single accent
// hue) into the CSS custom properties its case-study page renders with.
//
// Supersedes brand-accent.ts's single-color model: real sites don't reduce
// to one accent — backgrounds and foregrounds often invert wholesale between
// light/dark (confirmed on antibroadcasting, wylie-dog, and moxie-beauty),
// and the accent itself can shift hue between modes, not just lightness
// (el-camino's badge is olive in light, tan in dark). See lib/case-studies.ts
// for where each project's real values came from.
//
// Deliberately named "theme," not "brand" — the design system's --color-
// brand-1/2/3 tokens in base.css are the three permanent system palettes;
// each case study's theme is one-off content data with no relation to them.

export interface CaseStudyThemeMode {
  /** Full-bleed page background in this mode. */
  bg: string;
  /** Text color for the hero eyebrow/headline/button in this mode. */
  fg: string;
  /** Ghost button border at rest. Falls back to a derived fg/bg mix when
   *  the source site doesn't have a distinct border token. */
  border?: string;
  /** Ghost button's hover accent — the one moment this project's actual
   *  brand color (not just its neutral bg/fg pair) gets to show up. Falls
   *  back to fg when the source site doesn't split these out. */
  accent?: string;
}

export interface CaseStudyTheme {
  light: CaseStudyThemeMode;
  /** Omit for a project with no real dark mode of its own — light's values
   *  are reused for both of *our* site's themes, so the project's one true
   *  look doesn't get an invented variant that never existed. */
  dark?: CaseStudyThemeMode;
}

// 50%, not something more subtle like 30% — oklab's mix is roughly linear in
// *lightness*, but WCAG contrast is relative *luminance*, which compresses
// nonlinearly at the dark end. A 30% mix measured only 2.18:1 against
// el-camino's real bg/fg (its border has no distinct sample of its own, so
// it's the one project actually exercising this fallback) — comfortably
// under the 3:1 UI-contrast floor. 50% measures 4.00:1. Checked directly
// against el-camino's real colors, not assumed.
const derivedBorder = (mode: CaseStudyThemeMode) =>
  mode.border ?? `color-mix(in oklab, ${mode.fg} 50%, ${mode.bg})`;

const derivedAccent = (mode: CaseStudyThemeMode) => mode.accent ?? mode.fg;

/** Resolves a theme to the CSS custom properties its case-study page (and,
 *  for --cs-bg only, its home page row) render with — or undefined if the
 *  case study has no theme yet (e.g. a "coming soon" placeholder entry). */
export function resolveThemeVars(
  theme: CaseStudyTheme | undefined,
): Record<"--cs-bg" | "--cs-fg" | "--cs-border" | "--cs-accent", string> | undefined {
  if (!theme) return undefined;
  const dark = theme.dark ?? theme.light;
  return {
    "--cs-bg": `light-dark(${theme.light.bg}, ${dark.bg})`,
    "--cs-fg": `light-dark(${theme.light.fg}, ${dark.fg})`,
    "--cs-border": `light-dark(${derivedBorder(theme.light)}, ${derivedBorder(dark)})`,
    "--cs-accent": `light-dark(${derivedAccent(theme.light)}, ${derivedAccent(dark)})`,
  };
}

/** Just the background half, for FeatureWipe's row hover-fill — the home
 *  page row only borrows this project's bg tone as a decorative wash; it
 *  never adopts the project's fg/border/accent (those are reserved for the
 *  case-study page's own content, not our chrome — see CaseStudyHero.tsx). */
export function resolveThemeBg(theme: CaseStudyTheme | undefined): string | undefined {
  return resolveThemeVars(theme)?.["--cs-bg"];
}
