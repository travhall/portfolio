import { useRef, useState } from "react";

type AnimDir = "in" | "out" | null;

/**
 * Shared label-slide sequencing for the toggle-pill pattern (ThemeToggle,
 * MotionToggle): on toggle, slides the current label out, commits the new
 * value once it's clipped offscreen, then slides the new label in. Skips
 * the slide entirely — commits immediately — when `reduced` is true.
 *
 * Timing (160ms exit, 280ms enter) matches the .toggle-pill__label
 * is-exiting/is-entering CSS animations in app/components.css — if you
 * change one, change the other.
 */
export function useTogglePillAnimation() {
  const [animDir, setAnimDir] = useState<AnimDir>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  function runToggle(reduced: boolean, commit: () => void) {
    if (!reduced && labelRef.current) {
      setAnimDir("out");
      setTimeout(() => {
        commit();
        setAnimDir("in");
        setTimeout(() => setAnimDir(null), 280);
      }, 160);
    } else {
      commit();
    }
  }

  return { animDir, labelRef, runToggle };
}
