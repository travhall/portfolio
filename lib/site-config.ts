// Site-wide constants — links, contact details, and shared metadata.
// Single source of truth so URLs and copy stay in sync across pages.

const url = "https://travishall.design";

export const siteConfig = {
  name: "Travis Hall",
  title: "Travis Hall — Design & Code",
  description:
    "Portfolio of Travis Hall — senior UX designer and front-end developer creating thoughtful digital experiences.",
  keywords: [
    "Travis Hall",
    "UX design",
    "front-end development",
    "design systems",
    "portfolio",
  ],
  url,
  host: new URL(url).host,
  email: "hello@travishall.design",
  locale: "en_US",
  /** Falls back to opengraph-image/twitter-image file conventions in app/ when unset. */
  ogImage: "/og-image.png",
  links: {
    github: "https://github.com/travhall",
    linkedin: "https://www.linkedin.com/in/travhall/",
  },
  cv: "/Travis-Hall_CV.pdf",
} as const;
