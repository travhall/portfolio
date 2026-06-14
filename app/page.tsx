import type { Metadata } from "next";
import { HeroSection } from "@/components/hero/HeroSection";
import { ScrollCue } from "@/components/hero/ScrollCue";

export const metadata: Metadata = {
  title: "Travis Hall — Design & Code",
  description:
    "Portfolio of Travis Hall — senior UX designer and front-end developer creating thoughtful digital experiences.",
};

export default function HomePage() {
  return (
    <>
      <main className="page-root">
        {/* ── Intro ── statement text scrolls away before the hero pins ── */}
        <section className="intro-section">
          <div className="intro-section__inner">
            <p className="type-statement text-ink intro-section__statement">
              Creating thoughtful digital experiences through design &amp; code
            </p>
            <ScrollCue />
          </div>
        </section>

        {/* ── Hero ── OGL parallax image, sticky top:0 ──────────────────── */}
        <HeroSection intensity={1.5} />

        {/* ── Glass veil ── rides over the pinned hero as you scroll ─────── */}
        <div className="glass-veil" aria-hidden="true" />

        {/* ── Work panel ── project cards and all subsequent content ──────── */}
        <div className="work-panel" id="work">
          <div className="work-panel__header">
            <span className="type-eyebrow text-ink-muted">Selected Work</span>
            <span className="type-eyebrow text-ink-faint">2026</span>
          </div>
          {/* Project cards go here — placeholder until case-study content is designed */}
          <div className="work-panel__placeholder">
            <p className="type-lead text-ink-faint">Projects loading…</p>
          </div>
        </div>
      </main>
    </>
  );
}
