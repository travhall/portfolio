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

/** A credited role and the name(s) who filled it — one row in the Overview
 *  panel's Credits list. Plural `names` (not one row per person) because
 *  the reference pattern this is modeled on groups multiple names under one
 *  role (e.g. "Design & Development" naming two people). */
export interface CaseStudyCredit {
  role: string;
  names: string[];
}

/** One row in the Overview panel's Awards & Recognition list. `href` is
 *  optional — an award can be just a label with no link out. */
export interface CaseStudyAward {
  label: string;
  href?: string;
}

/** The case-study page's second section, right under the hero: a lead
 *  paragraph plus an optional meta panel (sectors/credits/awards). Every
 *  field past `body` is optional — a project with no awards yet just omits
 *  that list rather than rendering an empty heading. */
export interface CaseStudyOverview {
  body: string;
  sectors?: string[];
  credits?: CaseStudyCredit[];
  awards?: CaseStudyAward[];
}

/** One half of a `split` section. `wordmark` is a large, centered display
 *  of a short string (a project's name/logotype treatment) — for the
 *  pattern where a section pairs an image against plain brand type instead
 *  of another photo or a paragraph. */
export type CaseStudySectionSlot =
  | { kind: "image"; image: string; alt?: string }
  | { kind: "wordmark"; text: string }
  | { kind: "text"; eyebrow?: string; body: string };

/** A repeatable content block below the Overview. `full-image` is a single
 *  full-bleed image; `split` is two slots side by side (image+image,
 *  image+text, image+wordmark, in either order) — see
 *  components/features/CaseStudyMedia.tsx. This is the same three-pattern
 *  set (50/50 images, 50/50 image+text, full-width images) called out as
 *  the target layout language, expressed as one flexible shape rather than
 *  a fixed template per combination. */
export type CaseStudySection =
  | { type: "full-image"; image: string; alt?: string }
  | { type: "split"; left: CaseStudySectionSlot; right: CaseStudySectionSlot };

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
  /** Hero sub-statement, next to the eyebrow/headline lockup — not part of
   *  it, so CaseStudyHero's existing entrance/exit choreography for that
   *  lockup is untouched. Placeholder copy throughout; none of this is
   *  final content. */
  tagline?: string;
  /** Short service/discipline tags, rendered next to the tagline. */
  services?: string[];
  /** The lead paragraph + sectors/credits/awards meta panel below the hero. */
  overview?: CaseStudyOverview;
  /** Repeatable body content below the Overview — see CaseStudySection. */
  sections?: CaseStudySection[];
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
    // Mock content — copy and structure below are placeholders standing in
    // for real case-study content, exercising the section patterns
    // (Overview with no awards yet; a split image+image using the real
    // light/dark screenshots of the live showcase).
    tagline:
      "A typed component library and OKLCH token system built to close the gap between design and code.",
    services: ["Design Systems", "Component Architecture", "Design Tokens", "Documentation"],
    overview: {
      body:
        "Wylie Dog is a production design system built for a growing product team shipping across web and native surfaces. The work spans a three-tier token architecture, a Figma-synced pipeline, and a component library built on accessible primitives — replacing a patchwork of one-off styles with a single source of truth every team can build from.",
      sectors: ["Software", "Design Tooling"],
      credits: [{ role: "Design & Development", names: ["Travis Hall"] }],
    },
    sections: [
      {
        type: "split",
        left: { kind: "image", image: "/images/work-img-wyliedog-light.jpg", alt: "The design system's overview page in light mode" },
        right: { kind: "image", image: "/images/work-img-wyliedog-dark.jpg", alt: "The same overview page in dark mode" },
      },
    ],
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
    // Exercises: awards present, multiple sectors, a full-bleed image
    // followed by a split(text+image) — text on the left this time, image
    // on the right (antibroadcasting below reverses that order).
    tagline: "A ground-up rebuild for a skater-owned shop, from storefront to checkout.",
    services: ["Strategy", "E-commerce", "Art Direction", "Front-End Development"],
    overview: {
      body:
        "El Camino needed a shop that felt as considered as the boards on its walls. The rebuild covers the full storefront experience — category browsing, product pages, and checkout — built on a design system tuned for a fast-moving catalog with frequent drops.",
      sectors: ["Retail", "E-commerce"],
      credits: [
        { role: "Design & Development", names: ["Travis Hall"] },
        { role: "Photography", names: ["El Camino Skate Shop"] },
      ],
      awards: [{ label: "Visionary Impact Award", href: "https://elcaminoskateshop.netlify.app/" }],
    },
    sections: [
      { type: "full-image", image: "/images/work-img-elcamino-light.jpg", alt: "The storefront homepage in light mode" },
      {
        type: "split",
        left: { kind: "text", eyebrow: "Approach", body: "A dark, weathered palette and bold condensed type carry the shop's skate-culture identity across every surface, from the homepage down to individual product cards." },
        right: { kind: "image", image: "/images/work-img-elcamino-dark.jpg", alt: "The storefront homepage in dark mode" },
      },
    ],
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
    // Exercises: single sector, one credited role, no awards yet, and a
    // split(image+wordmark) followed by a full-bleed image.
    tagline: "An elevated brand identity for a lash and brow studio built on quiet, considered luxury.",
    services: ["Brand Identity", "Art Direction", "Web Design"],
    overview: {
      body:
        "Moxie asked for a space that felt like the treatment itself: unhurried, personal, and a little indulgent. The identity leans on a warm, low-contrast palette and a serif/sans pairing that reads as considered rather than clinical, carried through the site, booking flow, and in-studio signage.",
      sectors: ["Beauty & Wellness"],
      credits: [{ role: "Design & Development", names: ["Travis Hall"] }],
    },
    sections: [
      {
        type: "split",
        left: { kind: "image", image: "/images/work-img-moxie-light.jpg", alt: "The Moxie homepage" },
        right: { kind: "wordmark", text: "Moxie" },
      },
      { type: "full-image", image: "/images/work-img-moxie-dark.jpg", alt: "The Moxie homepage, evening variant" },
    ],
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
    // Exercises: multiple credited roles under one, external award link,
    // split(wordmark+image) — the mirror of moxie-beauty's image+wordmark
    // order — followed by split(image+text) with the image on the left.
    tagline: "A visual identity and site rebuild for a Minneapolis screen-printing shop, artist-run since 2005.",
    services: ["Brand Identity", "Web Design", "Packaging & Seeding"],
    overview: {
      body:
        "Twenty years of client work, zero design consistency across it. The redesign gives Antibroadcasting a print-shop identity as considered as the work it ships — a gold-and-ink palette, a condensed display face for headlines, and a site structure built around the portfolio, not the pitch.",
      sectors: ["Screen Printing", "Apparel"],
      credits: [{ role: "Design & Development", names: ["Travis Hall", "Antibroadcasting Team"] }],
      awards: [{ label: "Indigo Design Award", href: "https://antibroadcasting.vercel.app/" }],
    },
    sections: [
      {
        type: "split",
        left: { kind: "wordmark", text: "AB" },
        right: { kind: "image", image: "/images/work-img-antibroadcasting-light.jpg", alt: "The Antibroadcasting homepage in light mode" },
      },
      {
        type: "split",
        left: { kind: "image", image: "/images/work-img-antibroadcasting-dark.jpg", alt: "The Antibroadcasting homepage in dark mode" },
        right: { kind: "text", eyebrow: "Palette", body: "A single gold accent carries across both themes without changing hue — the one constant in a site that otherwise inverts wholesale between light and dark." },
      },
    ],
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
