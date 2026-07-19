import { caseStudies } from "@/lib/case-studies";
import { createMetadata } from "@/lib/metadata";
import { CaseStudyCard } from "@/components/features/CaseStudyCard";

// Every case study (featured and not), using the same CaseStudyCard as the
// case-study page's "Related Projects" nav (CaseStudyNav.tsx) — the full
// archive's layout beyond this grid isn't settled yet, so this is still a
// scaffold in that sense, but the card itself is the real, shared component.

export const metadata = createMetadata({
  title: "Work",
  path: "/work",
});

export default function WorkPage() {
  return (
    <main id="main-content">
      <div className="header-spacer" aria-hidden="true" />

      <div className="cs-container">
        <div className="case-grid">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.slug} study={study} />
          ))}
        </div>
      </div>
    </main>
  );
}
