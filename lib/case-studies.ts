// Centralized case study data — single source of truth for every place
// that lists or links to a project (home page feature list, /work/[slug]
// pages, etc.). The `accent` field mirrors the old portfolio's light/dark +
// dark-mode-image pattern, expressed as raw OKLCH strings since this
// project has no Tailwind theme layer to key off of — see lib/brand-accent.ts.
//
// Copy below (eyebrow/headline/buttonText) is carried over from the old
// portfolio as placeholder — none of it is final.
//
// `accent` values are each project's real brand color, sampled live from
// its production site (hue + chroma character preserved) and run through a
// fixed derivation so every project gets the same lightness ladder — L 0.85
// for the light-mode fill, L 0.50 for dark, with only hue and chroma
// varying per project:
//   light chroma = min(sampled chroma × 0.6, 0.12)
//   dark  chroma = min(sampled chroma × 0.9, 0.18)
// Dark started at L 0.55 (mirroring light's symmetric 0.85) but that only
// cleared AA by ~0.3 against --ink's dark-theme white — too thin a margin
// given every project measured almost identically there regardless of hue.
// Dropped to 0.50 for real headroom; see /kit's "Case study accents"
// section for the live contrast audit of each pairing — re-check it if any
// of these change.
//
//   wylie-dog        — #2563eb sampled from wylie-dog-ds-showcase.vercel.app
//                       (--color-button-primary-background / interactive blue)
//   el-camino        — oklch(0.68 0.065 60) sampled from elcaminoskateshop.netlify.app
//                       (--ui-button-surface, the tag/badge accent)
//   moxie-beauty     — oklch(0.7018 0.075 63) sampled from moxie-studio-teal.vercel.app
//                       (--accent custom property)
//   antibroadcasting — #de9300 sampled from antibroadcasting.vercel.app
//                       (--color-gold, the full-bleed section + badge accent)
//
// Note: el-camino and moxie-beauty land within 3° of hue and similarly low
// chroma — both are genuinely warm, muted neutral-tan brands in real life,
// so their case-study rows will read as close to the same color on the
// home page. That's real, not a derivation bug.

import type { BrandAccent } from "./brand-accent";

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
  /** This project's one-off accent color — the row tint on the home page
   *  and the full-bleed background on its case-study page. See
   *  lib/brand-accent.ts for why this isn't called "brand." */
  accent?: BrandAccent;
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
    accent: { light: "oklch(0.85 0.12 262.9)", dark: "oklch(0.50 0.18 262.9)" },
  },
  {
    slug: "el-camino",
    eyebrow: "New Site",
    headline: "El Camino Skate Shop",
    side: "left",
    image: "/images/photo-elcamino.jpg",
    buttonText: "Visit Skate Shop",
    featured: true,
    accent: { light: "oklch(0.85 0.04 60.0)", dark: "oklch(0.50 0.06 60.0)" },
  },
  {
    slug: "moxie-beauty",
    eyebrow: "New Site",
    headline: "Moxie Beauty",
    side: "right",
    image: "/images/photo-moxie.jpg",
    buttonText: "View Case Study",
    featured: true,
    accent: { light: "oklch(0.85 0.04 63.0)", dark: "oklch(0.50 0.07 63.0)" },
  },
  {
    slug: "antibroadcasting",
    eyebrow: "Redesign",
    headline: "Anti-broadcasting",
    side: "left",
    image: "/images/photo-antibroadcasting.jpg",
    buttonText: "View Redesign",
    featured: true,
    accent: { light: "oklch(0.85 0.09 73.0)", dark: "oklch(0.50 0.14 73.0)" },
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
