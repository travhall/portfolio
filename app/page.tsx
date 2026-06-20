import { ScrollCue } from "@/components/nav/ScrollCue";
import { FeatureWipe } from "@/components/features/FeatureWipe";
import { createMetadata } from "@/lib/metadata";
import { caseStudies } from "@/lib/case-studies";

export const metadata = createMetadata({ path: "/" });

export default function HomePage() {
  return (
    <main id="main-content">
      {/* ── Header spacer ─────────────────────────────────────────────────
          Empty row matching the topbar's visual footprint (--topbar-h).
          Gives the wordmark a grid cell to sit in rather than floating
          over a content edge. Same column grid + hairlines as all rows. cSpell:ignore topbar wordmark elcamino
      ──────────────────────────────────────────────────────────────────── */}
      <div className="header-spacer" aria-hidden="true" />

      {/* ── Intro ─────────────────────────────────────────────────────────
          Full-viewport panel. Same 3-column grid as FeatureWipe so the
          column hairlines read as one continuous vertical system.
          Content sits in the centre two columns, weight in the lower third.
      ──────────────────────────────────────────────────────────────────── */}
      <section className="intro-section">
        <div className="intro-section__inner">
          <h1 className="type-h1 text-ink intro-section__statement">
            Most things on the internet are fine. I try to do better.
          </h1>
          <ScrollCue to="#work" label="View selected work" />
        </div>
      </section>

      {/* ── Work ──────────────────────────────────────────────────────────
          Scroll-driven project feature section.
      ──────────────────────────────────────────────────────────────────── */}
      <FeatureWipe id="work" features={caseStudies} />
    </main>
  );
}
