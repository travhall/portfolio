// CaseStudyCard — one project card: image, eyebrow, headline. Shared between
// the case-study page's "Related Projects" nav (CaseStudyNav.tsx) and the
// /work archive grid (app/work/page.tsx) — same card, two contexts, per the
// brief that /work should reuse whatever the related-projects nav builds.
//
// Deliberately plain, our own type scale (type-eyebrow/type-h3), not a copy
// of any reference site's card styling. Static — no entrance choreography or
// hover media effects; these are secondary nav, not the page's main content.

import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies";

export function CaseStudyCard({ study }: { study: CaseStudy }) {
  if (study.comingSoon) {
    return (
      <div className="case-card case-card--disabled" aria-disabled="true">
        <div className="case-card__media case-card__media--empty" aria-hidden="true" />
        <p className="type-eyebrow text-ink-faint case-card__eyebrow">{study.eyebrow}</p>
        <h3 className="type-h3 text-ink-muted case-card__title">{study.headline}</h3>
        <p className="type-small text-ink-faint">Coming soon</p>
      </div>
    );
  }

  return (
    <Link href={`/work/${study.slug}`} className="case-card">
      <div className="case-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={study.image} alt={study.imageAlt ?? ""} className="case-card__img" />
      </div>
      <p className="type-eyebrow text-ink-muted case-card__eyebrow">{study.eyebrow}</p>
      <h3 className="type-h3 text-ink case-card__title">{study.headline}</h3>
    </Link>
  );
}
