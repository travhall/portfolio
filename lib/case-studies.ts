// Centralized case study data — single source of truth for every place
// that lists or links to a project (home page feature list, /work/[slug]
// pages, etc.).
//
// Copy below (eyebrow/headline/buttonText) is carried over from the old
// portfolio as placeholder — none of it is final.
//
// `theme` is each project's real palette, sampled directly from its live
// site or repo — not a single accent hue derived algorithmically. That
// approach (tried first) broke down fast: real sites don't reduce to one
// color. Confirmed across all four projects here:
//   - light/dark often invert wholesale (antibroadcasting, wylie-dog, and
//     moxie-beauty's background is literally their foreground and vice
//     versa between modes)
//   - the accent itself can shift hue between modes, not just lightness
//     (el-camino's badge is dark olive in light mode, warm tan in dark —
//     two different colors doing the same job, not one hue relit)
//   - not every project's dark values come from a public deploy: Moxie's
//     came from grep'ing /Users/travishall/GitHub/moxie-beauty/app/globals.css
//     directly after its live deploy's toggle couldn't be found automatically
//
// See lib/case-study-theme.ts for the CaseStudyTheme shape and how it
// resolves to --cs-bg/--cs-fg/--cs-border/--cs-accent/--cs-accent-text. See
// /kit's "Case study themes" section for the live contrast audit of every
// pairing — re-check it if any of these change.
//
//   wylie-dog        — wylie-dog-ds-showcase.vercel.app (light + dark toggle)
//   el-camino        — elcaminoskateshop.netlify.app (light + dark toggle)
//   moxie-beauty     — /Users/travishall/GitHub/moxie-beauty/app/globals.css
//                       (:root + .dark blocks — ivory-rose bg/fg, rose-gold accent)
//   antibroadcasting — antibroadcasting.vercel.app (Light/Dark toggle)

import type { CaseStudyTheme } from "./case-study-theme";

export interface CaseStudy {
  slug: string;
  eyebrow: string;
  headline: string;
  side: "left" | "right";
  image: string;
  imageDark?: string;
  imageAlt?: string;
  buttonText?: string;
  /** Shown on the home page's FeatureWipe section. Every case study —
   *  featured or not — appears in the /work archive and the Menu list. */
  featured: boolean;
  /** No case-study page or assets yet — listed as "Coming soon" instead
   *  of a link in /work and the Menu, and excluded from generateStaticParams. */
  comingSoon?: boolean;
  /** This project's real palette — the row tint on the home page and the
   *  full-bleed background + hero content colors on its case-study page.
   *  See lib/case-study-theme.ts for why this isn't called "brand." */
  theme?: CaseStudyTheme;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "wylie-dog",
    eyebrow: "Featured Project",
    headline: "Wylie Dog Design System",
    side: "right",
    image: "/images/photo-wyliedog.jpg",
    buttonText: "View Case Study",
    featured: true,
    theme: {
      // bg values are --color-background-primary straight from the design
      // system's own tokens file, more precise than an earlier hex sampling
      // pass. Button is its own real token (--color-button-primary-*), not
      // derived — same blue bg + near-white text in both modes; it's a
      // fixed, self-contained "on-brand-blue" pairing, not tied to the
      // page's own light/dark bg the way el-camino's is.
      light: {
        bg: "oklch(0.991 0.003 264.45)",
        fg: "#16181d",
        border: "#b8b9bc",
        accent: "#2563eb",
        button: { bg: "#2563eb", fg: "#fbfcfe" },
      },
      // wylie-dog has no distinct accent-text token of its own (its real
      // site uses the same blue for both button fills and text) — raw
      // #2563eb on this dark bg only measures 3.81:1, under 4.5:1 for small
      // text like the eyebrow. Lightened 20% toward white and re-measured
      // at 5.67:1 — still clearly blue, no longer borderline. Derived, not
      // sampled, and the one case in this file that had to be.
      dark: {
        bg: "oklch(0.149 0.012 259.72)",
        fg: "#eeeff1",
        border: "#4c4e52",
        accent: "#2563eb",
        accentText: "color-mix(in oklab, #2563eb 80%, white 20%)",
        button: { bg: "#2563eb", fg: "#fbfcfe" },
      },
    },
  },
  {
    slug: "el-camino",
    eyebrow: "New Site",
    headline: "El Camino Skate Shop",
    side: "left",
    image: "/images/photo-elcamino.jpg",
    buttonText: "Visit Skate Shop",
    featured: true,
    theme: {
      // bg is --surface-secondary, not --surface-primary — corrected after
      // an initial pass used the wrong surface tier. button.fg is still the
      // real --ui-button-text value (which is tied to --surface-primary in
      // their source, unaffected by this correction), so it's a separate,
      // deliberately different value from `bg` now, not the same-value
      // coincidence it read as before.
      //
      // No distinct border token sampled here — falls back to the derived
      // fg/bg mix in resolveThemeVars, rechecked against the corrected bg
      // (3.82:1 light / 4.46:1 dark, both clear the 3:1 UI floor).
      //
      // accentText is their real --content-emphasis (light) / --ui-accent
      // (dark) tokens, but light's raw value only measured 4.52:1 against
      // the corrected (lighter) bg — a razor-thin margin over the 4.5 AA
      // floor, the same problem wylie-dog's dark accentText had above.
      // Darkened 20% toward fg and re-measured at 6.01:1.
      light: {
        bg: "oklch(92% 0.012 70)",
        fg: "oklch(18% 0.024 70)",
        accent: "oklch(38% 0.072 117)",
        accentText: "color-mix(in oklab, oklch(51.5% 0.075 60) 80%, oklch(18% 0.024 70) 20%)",
        button: { bg: "oklch(38% 0.072 117)", fg: "oklch(96.5% 0.008 70)" },
      },
      dark: {
        bg: "oklch(22% 0.052 117)",
        fg: "oklch(98.5% 0.008 117)",
        accent: "oklch(68% 0.065 60)",
        accentText: "oklch(76% 0.055 60)",
        button: { bg: "oklch(68% 0.065 60)", fg: "oklch(12.5% 0.042 117)" },
      },
    },
  },
  {
    slug: "moxie-beauty",
    eyebrow: "New Site",
    headline: "Moxie Beauty",
    side: "right",
    image: "/images/photo-moxie.jpg",
    buttonText: "View Case Study",
    featured: true,
    theme: {
      // accentText from their real --accent-text tokens (rose-gold-600
      // light / rose-gold-300 dark) — darker/lighter than the raw accent
      // (rose-gold-500/300) specifically so it holds up as text. Button is
      // its own real --button/--button-foreground pair — genuinely
      // different shades (rose-gold-800/50) from the accent dot, not the
      // same color reused.
      light: {
        bg: "oklch(97.12% 0.0074 29.23)",
        fg: "oklch(9.47% 0.0834 29.23)",
        border: "color-mix(in oklab, oklch(14.84% 0.0024 48.79) 12%, transparent)",
        accent: "oklch(54% 0.092 63)",
        accentText: "oklch(42.47% 0.072 63)",
        button: { bg: "oklch(25.42% 0.042 63)", fg: "oklch(97.31% 0.028 63)" },
      },
      dark: {
        bg: "oklch(9.47% 0.0834 29.23)",
        fg: "oklch(97.12% 0.0074 29.23)",
        border: "color-mix(in oklab, oklch(97.12% 0.0074 29.23) 14%, transparent)",
        accent: "oklch(70.18% 0.075 63)",
        accentText: "oklch(70.18% 0.075 63)",
        button: { bg: "oklch(97.31% 0.028 63)", fg: "oklch(17.15% 0.038 63)" },
      },
    },
  },
  {
    slug: "antibroadcasting",
    eyebrow: "Redesign",
    headline: "Anti-broadcasting",
    side: "left",
    image: "/images/photo-antibroadcasting.jpg",
    buttonText: "View Redesign",
    featured: true,
    theme: {
      // accentText from their real --color-accent-text tokens — a much
      // darker gold (#833e00) in light mode specifically because the raw
      // gold only measures 2.26:1 on their own cream background, nowhere
      // close to usable as text; the vivid gold (#de9300, same as accent)
      // is reused as-is in dark mode where it already clears 8:1. Their
      // real --button-primary-* is gold bg + near-black text in both
      // modes (button-primary-border is that same dark #833e00 in light,
      // transparent in dark — no border at all, not "none sampled").
      light: {
        bg: "#f7f1e9",
        fg: "#080504",
        border: "#766d62",
        accent: "#de9300",
        accentText: "#833e00",
        button: { bg: "#de9300", fg: "#080504", border: "#833e00" },
      },
      dark: {
        bg: "#080504",
        fg: "#f7f1e9",
        border: "#342c29",
        accent: "#de9300",
        accentText: "#de9300",
        button: { bg: "#de9300", fg: "#080504", border: "transparent" },
      },
    },
  },
  // ── Non-featured archive entries ──────────────────────────────────────
  // Placeholders for the fuller /work archive — no live page or final
  // assets yet. Fill in eyebrow/headline/image and flip comingSoon to
  // false once each is built.
  {
    slug: "legacy-project",
    eyebrow: "TBD",
    headline: "Legacy project (from previous portfolio)",
    side: "left",
    image: "",
    featured: false,
    comingSoon: true,
  },
  {
    slug: "tbd-project",
    eyebrow: "TBD",
    headline: "Untitled case study",
    side: "right",
    image: "",
    featured: false,
    comingSoon: true,
  },
];
