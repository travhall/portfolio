import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { caseStudies } from "@/lib/case-studies";
import { createMetadata } from "@/lib/metadata";

// Scaffold only — case study page design isn't settled yet. This uses
// nothing but the type scale and existing components so it doesn't lock in
// any layout decisions; expect this to be rebuilt once that design lands.

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) return createMetadata({ path: `/work/${slug}` });
  return createMetadata({ title: study.headline, path: `/work/${study.slug}` });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = caseStudies.find((s) => s.slug === slug);
  if (!study) notFound();

  return (
    <main id="main-content">
      <div className="header-spacer" aria-hidden="true" />

      <section style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 var(--gut)" }}>
        <p className="type-eyebrow text-ink-muted">{study.eyebrow}</p>
        <h1 className="type-h1 text-ink">{study.headline}</h1>

        <img
          src={study.image}
          alt={study.imageAlt ?? ""}
          style={{ width: "100%", margin: "2rem 0" }}
        />

        <Button variant="ghost" href="/">
          Back to work
        </Button>
      </section>
    </main>
  );
}
