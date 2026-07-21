"use client";

// Rendered after CaseStudyNav (see app/work/[slug]/page.tsx) as the page's
// closing "back home" CTA. Not the owner of the exit animation itself —
// CaseStudyHero still registers that (see its exitHome/registerPageExit) —
// this just hands off to it via tryPageExit, the same mechanism the topbar
// wordmark uses to trigger that same animation from outside the page's own
// component tree (see lib/page-exit.ts).
//
// Also registers its own fade-out (plan 037) — wrapped in a plain <div>
// rather than animating the <Button> directly, since components/ui/
// Button.tsx isn't forwardRef-wrapped and this is the one caller that
// needs a ref, not a reason to change that shared component.

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { registerExitObserver, tryPageExit } from "@/lib/page-exit";

export function CaseStudyBackHome() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return registerExitObserver(() => {
      if (prefersReducedMotion() || !ref.current) return;
      // Same treatment as CaseStudyBody/CaseStudyHero's __meta exit —
      // see those files for why these exact values.
      gsap.to(ref.current, {
        opacity: 0,
        y: 14,
        ease: "power2.in",
        duration: 0.35,
      });
    });
  }, []);

  return (
    <div ref={ref}>
      <Button
        variant="solid"
        href="/"
        onClick={(e) => {
          // Leave modifier / non-primary clicks alone so "open in new tab",
          // "open in new window", etc. still work — same passthrough Topbar
          // and FeatureWipe.tsx's case-study buttons use.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
            return;
          }
          if (tryPageExit("/")) {
            e.preventDefault();
          }
        }}
      >
        Let&apos;s get you back home
      </Button>
    </div>
  );
}
