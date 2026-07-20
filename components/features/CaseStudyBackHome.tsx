"use client";

// Rendered after CaseStudyNav (see app/work/[slug]/page.tsx) as the page's
// closing "back home" CTA. Not the owner of the exit animation itself —
// CaseStudyHero still registers that (see its exitHome/registerPageExit) —
// this just hands off to it via tryPageExit, the same mechanism the topbar
// wordmark uses to trigger that same animation from outside the page's own
// component tree (see lib/page-exit.ts).

import { Button } from "@/components/ui/Button";
import { tryPageExit } from "@/lib/page-exit";

export function CaseStudyBackHome() {
  return (
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
  );
}
