"use client";

/**
 * ScrollCue — jumps to a target anchor via the shared Lenis instance.
 * Animated under normal motion; reduced motion keeps the jump but drops
 * the animated scroll (duration 0 — Lenis still handles the jump itself,
 * so it stays in sync with its own scroll-position bookkeeping rather
 * than a raw scrollIntoView call).
 *
 * Props:
 *   to      — CSS selector or element ID to scroll to (e.g. "#work")
 *   label   — button label (default: "Scroll down")
 */

import { Button } from "@/components/ui/Button";
import { useLenis } from "@/components/providers/SmoothScroll";
import { prefersReducedMotion } from "@/components/ui/ripple";

interface Props {
  to: string;
  label?: string;
}

export function ScrollCue({ to, label = "Scroll down" }: Props) {
  const lenis = useLenis();

  return (
    <Button
      variant="glass"
      icon="arrow-down"
      iconPos="right"
      onClick={() =>
        lenis?.scrollTo(to, { duration: prefersReducedMotion() ? 0 : 1.4 })
      }
    >
      {label}
    </Button>
  );
}
