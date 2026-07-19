import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { CaseStudyHero } from "@/components/features/CaseStudyHero";
import { caseStudies } from "@/lib/case-studies";
import { resolveThemeVars } from "@/lib/case-study-theme";
import { createMetadata } from "@/lib/metadata";

// Scaffold only — case study page design isn't settled yet. This uses
// nothing but the type scale and existing components so it doesn't lock in
// any layout decisions; expect this to be rebuilt once that design lands.

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return caseStudies
    .filter((study) => !study.comingSoon)
    .map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug && !s.comingSoon);
  if (!study) return createMetadata({ path: `/work/${slug}` });
  return createMetadata({ title: study.headline, path: `/work/${study.slug}` });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug && !s.comingSoon);
  if (!study) notFound();

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

      <section
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          padding: "var(--gut)",
        }}
      >
        <CaseStudyHero
          eyebrow={study.eyebrow}
          headline={study.headline}
          image={study.image}
          imageAlt={study.imageAlt}
        />
      </section>
    </main>
  );
}
