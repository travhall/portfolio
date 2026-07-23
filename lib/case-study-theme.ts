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
  /** Ghost button's hover accent, and the eyebrow dot — a filled shape, not
   *  text, so it carries the accent at full strength with no text-contrast
   *  requirement. Falls back to fg when the source site doesn't split
   *  these out. */
  accent?: string;
  /** The accent, recolored for use as actual text (the eyebrow label) —
   *  every real site sampled for this data keeps a separate, darker/lighter
   *  variant of its accent specifically for this, distinct from the
   *  badge/dot-fill color, because the raw accent frequently doesn't clear
   *  text contrast against bg (antibroadcasting's gold is 2.26:1 on its own
   *  cream — nowhere close). Falls back to `accent` when omitted, which is
   *  only safe to do if that's been checked. */
  accentText?: string;
  /** The project's real primary-button colors — a filled surface + its own
   *  contrasting text, not derived from bg/fg/accent. Every project sampled
   *  for this data has its own dedicated button tokens, often genuinely
   *  different from `accent` (Moxie's button is rose-gold-800/50, not the
   *  same rose-gold-500/300 used for the accent dot). Falls back to
   *  `accent`/`fg` when omitted. */
  button?: { bg: string; fg: string; border?: string };
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
// against el-camino's real colors, not assumed. cSpell:ignore oklab nonlinearly
const derivedBorder = (mode: CaseStudyThemeMode) =>
  mode.border ?? `color-mix(in oklab, ${mode.fg} 50%, ${mode.bg})`;

const derivedAccent = (mode: CaseStudyThemeMode) => mode.accent ?? mode.fg;
const derivedAccentText = (mode: CaseStudyThemeMode) =>
  mode.accentText ?? mode.accent ?? mode.fg;
const derivedButtonBg = (mode: CaseStudyThemeMode) =>
  mode.button?.bg ?? derivedAccent(mode);
const derivedButtonFg = (mode: CaseStudyThemeMode) =>
  mode.button?.fg ?? mode.bg;
const derivedButtonBorder = (mode: CaseStudyThemeMode) =>
  mode.button?.border ?? derivedButtonBg(mode);

type ThemeVars = Record<
  | "--cs-bg"
  | "--cs-fg"
  | "--cs-border"
  | "--cs-accent"
  | "--cs-accent-text"
  | "--cs-button-bg"
  | "--cs-button-fg"
  | "--cs-button-border",
  string
>;

/** Resolves a theme to the CSS custom properties its case-study page (and,
 *  for --cs-bg only, its home page row) render with — or undefined if the
 *  case study has no theme yet (e.g. a "coming soon" placeholder entry). */
export function resolveThemeVars(
  theme: CaseStudyTheme | undefined,
): ThemeVars | undefined {
  if (!theme) return undefined;
  const dark = theme.dark ?? theme.light;
  return {
    "--cs-bg": `light-dark(${theme.light.bg}, ${dark.bg})`,
    "--cs-fg": `light-dark(${theme.light.fg}, ${dark.fg})`,
    "--cs-border": `light-dark(${derivedBorder(theme.light)}, ${derivedBorder(dark)})`,
    "--cs-accent": `light-dark(${derivedAccent(theme.light)}, ${derivedAccent(dark)})`,
    "--cs-accent-text": `light-dark(${derivedAccentText(theme.light)}, ${derivedAccentText(dark)})`,
    "--cs-button-bg": `light-dark(${derivedButtonBg(theme.light)}, ${derivedButtonBg(dark)})`,
    "--cs-button-fg": `light-dark(${derivedButtonFg(theme.light)}, ${derivedButtonFg(dark)})`,
    "--cs-button-border": `light-dark(${derivedButtonBorder(theme.light)}, ${derivedButtonBorder(dark)})`,
  };
}
