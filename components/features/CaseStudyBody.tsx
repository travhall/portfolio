"use client";

// CaseStudyBody — wraps a case-study page's Overview + Media sections (the
// content between CaseStudyHero and CaseStudyNav) so it can fade out as a
// unit when the page exits — the "back home" button, the topbar wordmark,
// or clicking a related-project card (see plan 037; the mechanism reused
// here, lib/page-exit.ts's registerExitObserver, is the same one
// CaseStudyCardGrid, CaseStudyBackHome, and SiteFooter also use).
//
// Deliberately entrance-free — CaseStudyOverview's own file comment
// already states the design intent ("CaseStudyHero already carries the
// page's one big reveal moment; repeating it here would just be noise").
// This file doesn't change that; it only adds a symmetric *exit*, since
// that's specifically what was reported as missing.
//
// The Overview/Media content stays exactly what it always was (Server
// Components, passed in as children) — this wrapper only needs a ref and
// an effect, so it's the minimal client boundary, not a conversion of the
// content itself to client-rendered.

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { registerExitObserver } from "@/lib/page-exit";

export function CaseStudyBody({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return registerExitObserver(() => {
      if (prefersReducedMotion() || !ref.current) return;
      // Matches CaseStudyHero.tsx's own __meta exit fade exactly (opacity +
      // a small downward drift) — the established "generic secondary
      // content" exit treatment in this codebase, as opposed to the
      // clip-path + chromatic-burst treatment reserved for hero/card
      // photography.
      gsap.to(ref.current, {
        opacity: 0,
        y: 14,
        ease: "power2.in",
        duration: 0.35,
      });
    });
  }, []);

  return <div ref={ref}>{children}</div>;
}
