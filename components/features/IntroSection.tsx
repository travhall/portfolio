"use client";

/**
 * IntroSection — the home page's full-viewport hero. Client component so it
 * can play the entrance reveal on load: the statement's characters cascade up
 * out of their clip masks (the same reveal the FeatureWipe headlines use),
 * then the scroll cue fades up under it. Replays whenever the home page
 * mounts (return visits); the once-only chrome reveal lives in Topbar.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollCue } from "@/components/nav/ScrollCue";
import { createTextReveal } from "@/lib/text-reveal";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { ENTRANCE_DELAY } from "@/lib/entrance-timing";

export function IntroSection() {
  const statementRef = useRef<HTMLHeadingElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // prefersReducedMotion() reads the manual data-motion toggle first, then
    // the OS setting — under either, skip the reveal and show it as-is.
    if (prefersReducedMotion()) return;

    const statement = statementRef.current;
    const cue = cueRef.current;
    if (!statement) return;

    const reveal = createTextReveal(statement, {
      delay: ENTRANCE_DELAY.statement,
      duration: 0.75,
      stagger: 0.5,
    });

    if (cue) {
      gsap.set(cue, { opacity: 0, y: 24 });
    }

    let cancelled = false;
    reveal.ready.then(() => {
      if (cancelled) return;
      // Re-append the cue fade after any re-split cleared the timeline.
      if (cue) {
        reveal.tl.to(
          cue,
          { opacity: 1, y: 0, ease: "power2.out", duration: 0.6 },
          "-=0.35",
        );
      }
      reveal.tl.play();
    });

    return () => {
      cancelled = true;
      reveal.cleanup();
    };
  }, []);

  return (
    <section className="intro-section">
      <div className="intro-section__inner">
        <h1
          ref={statementRef}
          className="type-h1 text-ink intro-section__statement"
        >
          Most things on the internet are fine. I try to do better.*
        </h1>
        <div ref={cueRef} className="intro-section__cue">
          <ScrollCue to="#work" label="View selected work" />
        </div>
      </div>
    </section>
  );
}
