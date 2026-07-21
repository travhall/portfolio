"use client";

// CaseStudyCardGrid — renders a .case-grid of CaseStudyCards with sibling
// exit coordination. Shared by CaseStudyNav.tsx's "Related Projects" rail
// and app/work/page.tsx's full archive — one grid implementation, two
// contexts (mirrors CaseStudyCard.tsx's own "one card, two contexts"
// reuse).
//
// Two independent triggers both fan out to every card's playExit() via
// the same ref array:
//   - A page-level exit (the "back home" button or topbar wordmark, via
//     lib/page-exit.ts's registerExitObserver — see plan 034) plays every
//     card's exit in sync with CaseStudyHero's own exit.
//   - Clicking any one card (via its onExitStart callback — see plan 035)
//     plays every OTHER card's exit too, so the whole grid wipes away
//     together instead of just the clicked card.

import { useEffect, useRef } from "react";
import type { CaseStudy } from "@/lib/case-studies";
import { CaseStudyCard, type CaseStudyCardHandle } from "./CaseStudyCard";
import { registerExitObserver } from "@/lib/page-exit";

export function CaseStudyCardGrid({ studies }: { studies: CaseStudy[] }) {
  const cardRefs = useRef<(CaseStudyCardHandle | null)[]>([]);

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, studies.length);
    return registerExitObserver(() => {
      cardRefs.current.forEach((card) => card?.playExit());
    });
  }, [studies.length]);

  return (
    <div className="case-grid">
      {studies.map((study, i) => (
        <CaseStudyCard
          key={study.slug}
          study={study}
          index={i}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          onExitStart={() => {
            cardRefs.current.forEach((card, j) => {
              if (j !== i) card?.playExit();
            });
          }}
        />
      ))}
    </div>
  );
}
