// Centralized case study data — single source of truth for every place
// that lists or links to a project (home page feature list, /work/[slug]
// pages, etc.).
//
// Every case study is one content/case-studies/{slug}.json file (CMS-
// editable via Sveltia, see public/admin/config.yml) — the slug is the
// filename, not a stored field, so creating a new entry entirely through
// the CMS produces a real, working case study with zero code changes. This
// module is server-only (reads the filesystem) — see getCaseStudies below. cSpell:ignore Sveltia
//
// Copy below (eyebrow/headline/buttonText) is carried over from the old
// portfolio as placeholder — none of it is final.
//
// `theme` is each project's real background/brand palette. For the four
// real projects here it was sampled directly from the live site or repo,
// not a single accent hue derived algorithmically — that approach (tried
// first) broke down fast: real sites don't reduce to one color. light/dark
// often invert wholesale, and the accent itself can shift hue between
// modes, not just lightness (el-camino's badge is dark olive in light
// mode, warm tan in dark). A new case study can set as little as
// light.bg/light.fg, or omit theme entirely — see lib/case-study-theme.ts
// for the CaseStudyTheme shape and how unset fields are derived. See /kit's
// "Case study themes"/"Case study buttons" sections for the live contrast
// audit of every pairing — re-check it if any of these change.

import "server-only";
import { cache } from "react";
import fs from "node:fs/promises";
import path from "node:path";
import type { IconName } from "@/components/ui/Icon";
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

/** A text block's optional call-to-action link. `variant`/`iconPos`/`newTab`
 *  are safe to leave unset (CaseStudyMedia.tsx's TextBlock falls back to
 *  link/left/true). `icon` is different: unset genuinely means no icon, not
 *  a fallback to some default glyph — Button.tsx itself renders nothing
 *  when `icon` is undefined, and CaseStudyMedia.tsx passes it through as-is
 *  rather than defaulting it, so an author can deliberately choose an
 *  icon-less CTA. */
export interface CaseStudyTextBlockCta {
  label: string;
  href: string;
  variant?: "solid" | "ghost" | "link";
  icon?: IconName;
  iconPos?: "left" | "right";
  /** Opens in a new tab (target="_blank" rel="noopener noreferrer") when
   *  true or omitted — CTAs overwhelmingly point at a project's live site,
   *  not another page on this site. Set false for an internal link. */
  newTab?: boolean;
}

/** A block of editorial text — used both as a `split` slot (in a column)
 *  and, full-width, as its own `CaseStudySection`. One shape for both so
 *  there's a single field set to maintain in the type, the renderer, and
 *  the CMS config, not two similar-but-different ones. */
export interface CaseStudyTextBlock {
  eyebrow?: string;
  /** A short display-style title, more prominent than `eyebrow`. */
  heading?: string;
  /** Markdown — multiple paragraphs, bold/italic, inline links. */
  body: string;
  cta?: CaseStudyTextBlockCta;
}

/** One half of a `split` section. */
export type CaseStudySectionSlot =
  | { kind: "image"; image: string; alt?: string }
  | ({ kind: "text" } & CaseStudyTextBlock);

/** A repeatable content block below the Overview. `full-image` is a single
 *  full-bleed image; `full-text` is a centered CaseStudyTextBlock at full
 *  width; `split` is two slots side by side (image+image or image+text, in
 *  either order) — see components/features/CaseStudyMedia.tsx. This is the
 *  same three-pattern set (50/50 images, 50/50 image+text, full-width
 *  images) called out as the target layout language, expressed as one
 *  flexible shape rather than a fixed template per combination. */
export type CaseStudySection =
  | { type: "full-image"; image: string; alt?: string }
  | ({ type: "full-text" } & CaseStudyTextBlock)
  | { type: "split"; left: CaseStudySectionSlot; right: CaseStudySectionSlot };

/** Everything a content/case-studies/{slug}.json file holds — the entire
 *  editorial + presentation record for one case study, CMS-editable via
 *  Sveltia end to end. Nothing here needs code-level precision: theme's
 *  border/accent/accentText/button are all optional and safely derived
 *  when unset (see lib/case-study-theme.ts), and image is a plain CMS
 *  image-upload field like any other in this schema. */
export interface CaseStudyContent {
  eyebrow: string;
  headline: string;
  buttonText?: string;
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
  /** This project's real background/brand palette — the row tint on the
   *  home page and the full-bleed background + hero content colors on its
   *  case-study page. Optional: a project with no theme set just renders in
   *  the site's own system voice. See lib/case-study-theme.ts for why this
   *  isn't called "brand." */
  theme?: CaseStudyTheme;
  side: "left" | "right";
  image: string;
  imageDark?: string;
  imageAlt?: string;
  /** Shown on the home page's FeatureWipe section. Every case study —
   *  featured or not — appears in the /work archive and the Menu list. */
  featured: boolean;
  /** No case-study page or assets yet — listed as "Coming soon" instead
   *  of a link in /work and the Menu, and excluded from generateStaticParams. */
  comingSoon?: boolean;
  /** Home page row / related-nav sort position, lower first. Omit to sort
   *  after every explicitly ordered entry. */
  order?: number;
}

/** The merged public shape every consumer (FeatureWipe, CaseStudyCard,
 *  CaseStudyNav, SiteFooter, /work, /kit, /work/[slug]) uses — a
 *  CaseStudyContent plus the slug derived from its filename. */
export interface CaseStudy extends CaseStudyContent {
  slug: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content/case-studies");

/** Reads every content/case-studies/*.json file and returns them as
 *  CaseStudy records, slug derived from filename. Server-only (fs) and
 *  wrapped in React's cache() so every consumer sharing one render pass —
 *  the root layout, a page, CaseStudyNav — only hits the filesystem once. */
export const getCaseStudies = cache(async (): Promise<CaseStudy[]> => {
  const files = await fs.readdir(CONTENT_DIR);
  const studies = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf-8");
        const content = JSON.parse(raw) as CaseStudyContent;
        return { slug: file.replace(/\.json$/, ""), ...content };
      }),
  );
  return studies.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
});

/** The 2 preceding + 2 subsequent case studies for a "Related Projects"-style
 *  nav on a case-study page — not an actual relatedness match (no shared
 *  tags/sectors involved), just positional neighbors in `allStudies`,
 *  circular so a study at either end still gets a full set. comingSoon
 *  entries are excluded (no page to link to) and never counted as one of
 *  the 4 slots. Deduped against the current slug and each other — with
 *  only 4 published case studies today, preceding/subsequent wrap into the
 *  same 3 others; a genuine 4 distinct picks only appears once a 5th is
 *  published. */
export function getRelatedCaseStudies(
  allStudies: CaseStudy[],
  currentSlug: string,
  count = 2,
): CaseStudy[] {
  const linkable = allStudies.filter((s) => !s.comingSoon);
  const index = linkable.findIndex((s) => s.slug === currentSlug);
  if (index === -1) return [];

  const n = linkable.length;
  const seen = new Set([currentSlug]);
  const related: CaseStudy[] = [];

  for (let offset = count; offset >= 1; offset--) {
    const study = linkable[(index - offset + n) % n];
    if (!seen.has(study.slug)) {
      seen.add(study.slug);
      related.push(study);
    }
  }
  for (let offset = 1; offset <= count; offset++) {
    const study = linkable[(index + offset) % n];
    if (!seen.has(study.slug)) {
      seen.add(study.slug);
      related.push(study);
    }
  }

  return related;
}
