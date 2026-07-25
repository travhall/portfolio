import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main-content">
      <div className="header-spacer" aria-hidden="true" />

      <section className="intro-section">
        <div className="intro-section__inner">
          <p className="type-eyebrow text-water">404</p>
          <h1 className="type-h1 text-ink statement-measure">
            This page doesn&apos;t exist.
          </h1>
          <p className="type-lead text-ink-muted">
            Well, I mean, this page technically does exist &hellip; but the one
            you&apos;re looking for may have been moved or vanished into thin
            air.
          </p>
          <Button variant="solid" icon="arrow-right" iconPos="right" href="/">
            Let&apos;s get you back home
          </Button>
        </div>
      </section>

      <div className="header-spacer" aria-hidden="true" />
    </main>
  );
}

// cSpell:ignore doesn
