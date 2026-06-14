"use client";

/**
 * ScrollCue — link in the intro statement that smooth-scrolls to the
 * featured work section via the shared Lenis instance.
 */

import { Button } from "@/components/ui/Button";
import { useLenis } from "@/components/providers/SmoothScroll";

export function ScrollCue() {
  const lenis = useLenis();

  return (
    <Button
      variant="link"
      icon="arrow-down"
      iconPos="right"
      onClick={() => lenis?.scrollTo("#work", { duration: 1.4 })}
    >
      View selected work
    </Button>
  );
}
