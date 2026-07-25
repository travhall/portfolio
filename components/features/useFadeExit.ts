// useFadeExit — the shared "generic secondary content" exit treatment used
// by case-study page components that don't own a more elaborate exit
// choreography of their own (CaseStudyHero's __meta exit uses the same
// values but is embedded in its own larger combined timeline, so it isn't
// a caller of this hook). Registers a lib/page-exit.ts exit observer for
// the lifetime of the component; the returned cleanup unregisters it.

import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { registerExitObserver } from "@/lib/page-exit";

export function useFadeExit(ref: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    return registerExitObserver(() => {
      if (prefersReducedMotion() || !ref.current) return;
      gsap.to(ref.current, {
        opacity: 0,
        y: 14,
        ease: "power2.in",
        duration: 0.35,
      });
    });
  }, [ref]);
}
