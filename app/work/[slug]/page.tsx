import { notFound } from "next/navigation";
import { BackHomeButton } from "@/components/nav/BackHomeButton";
import { caseStudies } from "@/lib/case-studies";
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

  const brand = study.brandLight
    ? `light-dark(${study.brandLight}, ${study.brandDark ?? study.brandLight})`
    : undefined;

  return (
    <main id="main-content">
      {/* Full-bleed brand background — the shared element the home page's
          featured panel morphs into (view-transition-name: fw-brand, in
          layout.css), so the color is seamless across the transition. */}
      {brand && (
        <div
          className="cs-brand-bg"
          aria-hidden="true"
          style={{ background: brand }}
        />
      )}

      <div className="header-spacer" aria-hidden="true" />

      <section
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          padding: "var(--gut)",
        }}
      >
        <p className="type-eyebrow text-ink-muted">{study.eyebrow}</p>
        <h1 className="type-h1 text-ink">{study.headline}</h1>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={study.image}
          alt={study.imageAlt ?? ""}
          width={756}
          height={910}
          style={{ width: "100%", height: "auto", margin: "2rem 0" }}
        />

        <BackHomeButton>Let&apos;s get you back home</BackHomeButton>
      </section>
    </main>
  );
}
