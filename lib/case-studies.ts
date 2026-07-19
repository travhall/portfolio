// Centralized case study data — single source of truth for every place
// that lists or links to a project (home page feature list, /work/[slug]
// pages, etc.). The `accent` field mirrors the old portfolio's light/dark +
// dark-mode-image pattern, expressed as raw OKLCH strings since this
// project has no Tailwind theme layer to key off of — see lib/brand-accent.ts.
//
// Copy below (eyebrow/headline/buttonText) is carried over from the old
// portfolio as placeholder — none of it is final. Every `accent` value below
// is a placeholder too — the true per-project colors live in each project's
// own brand, not here; swap them in once each case study's design is final,
// and re-check /kit's case-study accent section for contrast when you do.

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
    accent: { light: "oklch(0.83 0.07 195.9)", dark: "oklch(0.48 0.09 195.9)" },
  },
  {
    slug: "el-camino",
    eyebrow: "New Site",
    headline: "El Camino Skate Shop",
    side: "left",
    image: "/images/photo-elcamino.jpg",
    buttonText: "Visit Skate Shop",
    featured: true,
    accent: { light: "oklch(0.87 0.115 80)", dark: "oklch(0.6 0.16 80)" },
  },
  {
    slug: "moxie-beauty",
    eyebrow: "New Site",
    headline: "Moxie Beauty",
    side: "right",
    image: "/images/photo-moxie.jpg",
    buttonText: "View Case Study",
    featured: true,
    accent: { light: "oklch(0.85 0.1 350)", dark: "oklch(0.55 0.15 350)" },
  },
  {
    slug: "antibroadcasting",
    eyebrow: "Redesign",
    headline: "Anti-broadcasting",
    side: "left",
    image: "/images/photo-antibroadcasting.jpg",
    buttonText: "View Redesign",
    featured: true,
    accent: { light: "oklch(0.82 0.12 25)", dark: "oklch(0.52 0.17 25)" },
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
