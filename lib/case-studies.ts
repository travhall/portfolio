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
// resolves to --cs-bg/--cs-fg/--cs-border/--cs-accent. See /kit's "Case
// study accents" section for the live contrast audit of every pairing —
// re-check it if any of these change.
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
      light: { bg: "#fbfcfe", fg: "#16181d", border: "#b8b9bc", accent: "#2563eb" },
      dark: { bg: "#080b10", fg: "#eeeff1", border: "#4c4e52", accent: "#2563eb" },
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
      // No distinct border token sampled here — falls back to the derived
      // fg/bg mix in resolveThemeVars.
      light: { bg: "oklch(96.5% 0.008 70)", fg: "oklch(18% 0.024 70)", accent: "oklch(38% 0.072 117)" },
      dark: { bg: "oklch(12.5% 0.042 117)", fg: "oklch(98.5% 0.008 117)", accent: "oklch(68% 0.065 60)" },
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
      light: {
        bg: "oklch(97.12% 0.0074 29.23)",
        fg: "oklch(9.47% 0.0834 29.23)",
        border: "color-mix(in oklab, oklch(14.84% 0.0024 48.79) 12%, transparent)",
        accent: "oklch(54% 0.092 63)",
      },
      dark: {
        bg: "oklch(9.47% 0.0834 29.23)",
        fg: "oklch(97.12% 0.0074 29.23)",
        border: "color-mix(in oklab, oklch(97.12% 0.0074 29.23) 14%, transparent)",
        accent: "oklch(70.18% 0.075 63)",
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
      light: { bg: "#f7f1e9", fg: "#080504", border: "#766d62", accent: "#de9300" },
      dark: { bg: "#080504", fg: "#f7f1e9", border: "#342c29", accent: "#de9300" },
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
