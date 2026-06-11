// Site-wide constants — links, contact details, and shared metadata.
// Single source of truth so URLs and copy stay in sync across pages.

export const siteConfig = {
  name: "Travis Hall",
  title: "Travis Hall — Design & Code",
  description:
    "Portfolio of Travis Hall — senior UX designer and front-end developer creating thoughtful digital experiences.",
  url: "https://travishall.design",
  email: "hello@travishall.design",
  links: {
    github: "https://github.com/travhall",
    linkedin: "https://www.linkedin.com/in/travhall/",
  },
  cv: "/Travis-Hall_CV.pdf",
} as const;
