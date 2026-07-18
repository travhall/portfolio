"use client";

/**
 * BackHomeButton — the case-study page's "back to home" CTA. Routes through
 * next-view-transitions instead of Button's default plain <a>, so navigating
 * home gets the same client-side view transition (brand-color cross-fade,
 * entrance choreography already primed by the time the transition captures
 * the new page) that the Topbar wordmark link already produces. Without
 * this, Button's href renders a plain anchor — a full document reload with
 * no transition capability at all, regardless of how well the destination
 * page's own entrance is fixed.
 */

import { useTransitionRouter } from "next-view-transitions";
import { Button } from "@/components/ui/Button";

export function BackHomeButton({ children }: { children: React.ReactNode }) {
  const router = useTransitionRouter();

  return (
    <Button
      variant="ghost"
      href="/"
      onClick={(e) => {
        // Leave modifier / non-primary clicks alone so "open in new tab",
        // "open in new window", etc. still work — same passthrough
        // FeatureWipe.tsx's case-study buttons already use.
        if (
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          e.button !== 0
        ) {
          return;
        }
        e.preventDefault();
        router.push("/");
      }}
    >
      {children}
    </Button>
  );
}
