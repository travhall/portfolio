// The theme-correct photo for a case study — its dark variant in dark mode
// when it has one, otherwise the single light image covers both. Shared by
// every client surface that picks a WebGL texture src (FeatureWipe, the
// menu filmstrip); the <img> fallbacks do the same switch in pure CSS.

import type { CaseStudy } from "./case-studies";
import type { Theme } from "./use-theme";

export function imageFor(
  study: Pick<CaseStudy, "image" | "imageDark">,
  theme: Theme,
): string {
  return theme === "dark" && study.imageDark ? study.imageDark : study.image;
}
