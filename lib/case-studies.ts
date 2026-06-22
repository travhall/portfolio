// Centralized case study data — single source of truth for every place
// that lists or links to a project (home page feature list, /work/[slug]
// pages, etc.). Mirrors the old portfolio's brandLight/brandDark +
// dark-mode-image pattern, expressed as raw OKLCH strings since this
// project has no Tailwind theme layer to key off of.
//
// Copy below (eyebrow/headline/buttonText) is carried over from the old
// portfolio as placeholder — none of it is final.

export interface CaseStudy {
  slug: string;
  eyebrow: string;
  headline: string;
  side: "left" | "right";
  image: string;
  imageDark?: string;
  imageAlt?: string;
  buttonText?: string;
  /** OKLCH string used as the row's tint in light mode, and as the
   *  magnetic-dots halftone's ink color. */
  brandLight?: string;
  /** OKLCH string used as the row's tint in dark mode, and as the
   *  magnetic-dots halftone's ink color. Falls back to brandLight. */
  brandDark?: string;
  /** Source screenshot the magnetic-dots hover halftone is generated
   *  from — light mode. */
  revealImage?: string;
  /** Source screenshot the magnetic-dots hover halftone is generated
   *  from — dark mode. */
  revealImageDark?: string;
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "wylie-dog",
    eyebrow: "Featured Project",
    headline: "Wylie Dog Design System",
    side: "right",
    image: "/images/photo-wyliedog.jpg",
    buttonText: "View Case Study",
    brandLight: "oklch(0.83 0.07 195.9)",
    brandDark: "oklch(0.48 0.09 195.9)",
    revealImage: "/images/work-img-wyliedog-light.jpg",
    revealImageDark: "/images/work-img-wyliedog-dark.jpg",
  },
  {
    slug: "el-camino",
    eyebrow: "New Site",
    headline: "El Camino Skate Shop",
    side: "left",
    image: "/images/photo-elcamino.jpg",
    buttonText: "Visit Skate Shop",
    brandLight: "oklch(0.87 0.115 80)",
    brandDark: "oklch(0.6 0.16 80)",
    revealImage: "/images/work-img-elcamino-light.jpg",
    revealImageDark: "/images/work-img-elcamino-dark.jpg",
  },
  {
    slug: "moxie-beauty",
    eyebrow: "New Site",
    headline: "Moxie Beauty",
    side: "right",
    image: "/images/photo-moxie.jpg",
    buttonText: "View Case Study",
    brandLight: "oklch(0.85 0.1 350)",
    brandDark: "oklch(0.55 0.15 350)",
    revealImage: "/images/work-img-moxie-light.jpg",
    revealImageDark: "/images/work-img-moxie-dark.jpg",
  },
  {
    slug: "antibroadcasting",
    eyebrow: "Redesign",
    headline: "Anti-broadcasting",
    side: "left",
    image: "/images/photo-antibroadcasting.jpg",
    buttonText: "View Redesign",
    brandLight: "oklch(0.82 0.12 25)",
    brandDark: "oklch(0.52 0.17 25)",
    revealImage: "/images/work-img-antibroadcasting-light.jpg",
    revealImageDark: "/images/work-img-antibroadcasting-dark.jpg",
  },
];
