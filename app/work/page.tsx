import { getCaseStudies } from "@/lib/case-studies";
import { createMetadata } from "@/lib/metadata";
import { CaseStudyCardGrid } from "@/components/features/CaseStudyCardGrid";

// Every case study (featured and not), using the same CaseStudyCardGrid
// as the case-study page's "Related Projects" nav (CaseStudyNav.tsx) —
// the full archive's layout beyond this grid isn't settled yet, so this
// is still a scaffold in that sense, but the grid itself is the real,
// shared component.

export const metadata = createMetadata({
  title: "Work",
  path: "/work",
});

export default async function WorkPage() {
  const caseStudies = await getCaseStudies();
  return (
    <main id="main-content">
      <div className="header-spacer" aria-hidden="true" />

      <div className="cs-container">
        <CaseStudyCardGrid studies={caseStudies} />
      </div>
    </main>
  );
}
