import { IntroSection } from "@/components/features/IntroSection";
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
          Full-viewport hero (client component — plays the entrance reveal on
          load). Same 3-column grid as FeatureWipe so the column hairlines
          read as one continuous vertical system.
      ──────────────────────────────────────────────────────────────────── */}
      <IntroSection />

      {/* ── Work ──────────────────────────────────────────────────────────
          Scroll-driven project feature section.
      ──────────────────────────────────────────────────────────────────── */}
      <FeatureWipe id="work" features={caseStudies.filter((s) => s.featured)} />
    </main>
  );
}
