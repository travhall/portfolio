// CaseStudyNav — "Related Projects" section on a case-study page: lets a
// visitor keep browsing without navigating home or opening the menu. Cards
// are the 2 preceding + 2 subsequent case studies (see
// lib/case-studies.ts's getRelatedCaseStudies, called by the page above this
// component — presentation only here) — positional neighbors, not a
// tag/sector match. Sits between the page's own content and the global
// SiteFooter (rendered inside <main>, right before it closes).
//
// The card grid itself (hover/entrance/exit coordination, including the
// page-level-exit-sync and sibling-exit-on-click behavior) lives in
// CaseStudyCardGrid.tsx, a Client Component — this file is a plain Server
// Component again (it has no hooks of its own after plan 035 moved them
// into that shared grid).

import type { CaseStudy } from "@/lib/case-studies";
import { CaseStudyCardGrid } from "./CaseStudyCardGrid";
import { Button } from "@/components/ui/Button";

// `heading` / `showAllLink` let the same nav serve two jobs: the default
// "More Work" row of other top-level projects (with a link out to /work), and
// a project's own companion stories — "Companion Stories" on a parent page,
// "More from <project>" on a sub-story — which stay inside the project and so
// omit the /work link.
export function CaseStudyNav({
  related,
  heading = "More Work",
  showAllLink = true,
}: {
  related: CaseStudy[];
  heading?: string;
  showAllLink?: boolean;
}) {
  if (related.length === 0) return null;

  return (
    <div className="cs-container">
      <nav
        className={`case-nav${showAllLink ? "" : " case-nav--companions"}`}
        aria-label={heading}
      >
        <div className="case-nav__header">
          <h2 className="type-eyebrow text-ink-muted">{heading}</h2>
          {showAllLink && (
            <Button variant="link" icon="arrow-up-right" href="/work">
              All Projects
            </Button>
          )}
        </div>
        <CaseStudyCardGrid studies={related} />
      </nav>
    </div>
  );
}
