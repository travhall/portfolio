import Link from "next/link";
import { caseStudies } from "@/lib/case-studies";
import { createMetadata } from "@/lib/metadata";

// Scaffold only — the full work archive's design isn't settled yet. Plain
// grid of every case study (featured and not), using nothing but the type
// scale so it doesn't lock in any layout decisions. Expect a rebuild once
// that design lands.

export const metadata = createMetadata({
  title: "Work",
  path: "/work",
});

export default function WorkPage() {
  return (
    <main id="main-content">
      <div className="header-spacer" aria-hidden="true" />

      <section
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          padding: "var(--gut)",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "2rem",
        }}
      >
        {caseStudies.map((study) =>
          study.comingSoon ? (
            <div key={study.slug} aria-disabled="true">
              <p className="type-eyebrow text-ink-faint">{study.eyebrow}</p>
              <h2 className="type-h3 text-ink-muted">{study.headline}</h2>
              <p className="type-small text-ink-faint">Coming soon</p>
            </div>
          ) : (
            <Link key={study.slug} href={`/work/${study.slug}`}>
              <p className="type-eyebrow text-ink-muted">{study.eyebrow}</p>
              <h2 className="type-h3 text-ink">{study.headline}</h2>
            </Link>
          ),
        )}
      </section>
    </main>
  );
}
