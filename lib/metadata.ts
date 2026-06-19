// Shared helper so every page builds its <title>, description, canonical
// URL, and Open Graph/Twitter tags from siteConfig instead of duplicating
// them by hand. Pages pass a short `title` (e.g. "About") and the root
// layout's title template appends the site host for the rendered <title>.

import type { Metadata } from "next";
import { siteConfig } from "./site-config";

interface PageMetadataOptions {
  /** Short page title, e.g. "About". Omit to use the site default title. */
  title?: string;
  description?: string;
  /** Path relative to siteConfig.url, e.g. "/about". Defaults to "/". */
  path?: string;
  noIndex?: boolean;
}

export function createMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
}: PageMetadataOptions = {}): Metadata {
  const canonical = new URL(path, siteConfig.url).toString();
  const fullTitle = title ? `${title} — ${siteConfig.host}` : siteConfig.title;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type: "website",
      images: [siteConfig.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [siteConfig.ogImage],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
