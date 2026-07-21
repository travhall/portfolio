import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { CaseStudyHero } from "@/components/features/CaseStudyHero";
import { CaseStudyOverview } from "@/components/features/CaseStudyOverview";
import { CaseStudyMedia } from "@/components/features/CaseStudyMedia";
import { CaseStudyNav } from "@/components/features/CaseStudyNav";
import { CaseStudyBody } from "@/components/features/CaseStudyBody";
import { CaseStudyBackHome } from "@/components/features/CaseStudyBackHome";
import { getCaseStudies, getRelatedCaseStudies } from "@/lib/case-studies";
import { resolveThemeVars } from "@/lib/case-study-theme";
import { createMetadata } from "@/lib/metadata";

// Mockup pass — content below (tagline/services/overview/sections) is
// placeholder copy, not final. The goal here is coverage of the content
// patterns (see lib/case-studies.ts's CaseStudySection), not final design.

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const caseStudies = await getCaseStudies();
  return caseStudies
    .filter((study) => !study.comingSoon)
    .map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const caseStudies = await getCaseStudies();
  const study = caseStudies.find((s) => s.slug === slug && !s.comingSoon);
  if (!study) return createMetadata({ path: `/work/${slug}` });
  return createMetadata({ title: study.headline, path: `/work/${study.slug}` });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const caseStudies = await getCaseStudies();
  const study = caseStudies.find((s) => s.slug === slug && !s.comingSoon);
  if (!study) notFound();
  const related = getRelatedCaseStudies(caseStudies, study.slug);

  const themeVars = resolveThemeVars(study.theme);

  return (
    <main
      id="main-content"
      style={themeVars as CSSProperties}
    >
      {/* Full-bleed brand background — the shared element the home page's
          featured panel morphs into (view-transition-name: fw-brand, in
          layout.css), so the color is seamless across the transition.
          Reads var(--cs-bg) via CSS (layout.css) rather than an inline
          background here, so it inherits from the --cs-* vars set on this
          <main> above instead of needing its own copy of the resolved value. */}
      {themeVars && <div className="cs-brand-bg" aria-hidden="true" />}

      <div className="header-spacer" aria-hidden="true" />

      <div className="cs-container">
        <CaseStudyHero
          eyebrow={study.eyebrow}
          headline={study.headline}
          image={study.image}
          imageAlt={study.imageAlt}
          tagline={study.tagline}
          services={study.services}
        />
      </div>

      <CaseStudyBody>
        {study.overview && (
          <div className="cs-container">
            <CaseStudyOverview {...study.overview} />
          </div>
        )}

        {/* Media sections are full-bleed (no .cs-container) — they run edge
            to edge of the page, matching the reference's 50/50 and
            full-width image patterns. */}
        {study.sections?.map((section, i) => (
          <div key={i} className="cs-section">
            <CaseStudyMedia section={section} />
          </div>
        ))}
      </CaseStudyBody>

      <CaseStudyNav related={related} />

      <div className="cs-container cs-back-home">
        <CaseStudyBackHome />
      </div>
    </main>
  );
}
