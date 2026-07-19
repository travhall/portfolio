// brand-accent.ts — resolves a case study's one-off accent color into the
// light-dark() CSS value used for its brand fill (FeatureWipe's row tint and
// the case-study page's full-bleed background). Single source of truth so
// the two call sites can't drift out of sync with each other.
//
// Deliberately named "accent," not "brand" — the design system's --color-
// brand-1/2/3 tokens in base.css are the three permanent system palettes;
// each case study's accent is one-off content data with no relation to them.
//
// Contrast for text laid over a resolved accent isn't verified here (OKLCH
// → sRGB resolution needs an actual browser, same as ContrastSwatch already
// relies on) — it's checked live in /kit, which renders every case study's
// accent through the same contrast measurement as the rest of the system.

export interface BrandAccent {
  /** OKLCH string used as the fill in light mode. */
  light: string;
  /** OKLCH string used as the fill in dark mode. Falls back to `light`. */
  dark?: string;
}

/** Resolves an accent to its light-dark() CSS value, or undefined if the
 *  case study has no accent (e.g. a "coming soon" placeholder entry). */
export function resolveAccentBg(accent: BrandAccent | undefined): string | undefined {
  if (!accent) return undefined;
  return `light-dark(${accent.light}, ${accent.dark ?? accent.light})`;
}
