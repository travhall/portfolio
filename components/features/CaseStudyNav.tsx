// CaseStudyNav — "Related Projects" section on a case-study page: lets a
// visitor keep browsing without navigating home or opening the menu. Cards
// are the 2 preceding + 2 subsequent case studies (see
// lib/case-studies.ts's getRelatedCaseStudies, called by the page above this
// component — presentation only here) — positional neighbors, not a
// tag/sector match. Sits between the page's own content and the global
// SiteFooter (rendered inside <main>, right before it closes).

import type { CaseStudy } from "@/lib/case-studies";
import { CaseStudyCard } from "./CaseStudyCard";
import { Button } from "@/components/ui/Button";

export function CaseStudyNav({ related }: { related: CaseStudy[] }) {
  if (related.length === 0) return null;

  return (
    <div className="cs-container">
      <nav className="case-nav" aria-label="More case studies">
        <div className="case-nav__header">
          <p className="type-eyebrow text-ink-muted">More Work</p>
          <Button variant="link" icon="arrow-up-right" href="/work">
            All Projects
          </Button>
        </div>
        <div className="case-grid">
          {related.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>
      </nav>
    </div>
  );
}
