"use client";

/**
 * ScrollCue — smooth-scrolls to a target anchor via the shared Lenis instance.
 *
 * Props:
 *   to      — CSS selector or element ID to scroll to (e.g. "#work")
 *   label   — button label (default: "Scroll down")
 */

import { Button } from "@/components/ui/Button";
import { useLenis } from "@/components/providers/SmoothScroll";

interface Props {
  to: string;
  label?: string;
}

export function ScrollCue({ to, label = "Scroll down" }: Props) {
  const lenis = useLenis();

  return (
    <Button
      variant="solid"
      icon="arrow-down"
      iconPos="right"
      onClick={() => lenis?.scrollTo(to, { duration: 1.4 })}
    >
      {label}
    </Button>
  );
}
