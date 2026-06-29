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
 *
 * runToggle clears any timeout chain from a still-in-flight prior call
 * before starting a new one, so two rapid toggles can't leave two
 * overlapping setAnimDir schedules fighting over the same shared state.
 */
export function useTogglePillAnimation() {
  const [animDir, setAnimDir] = useState<AnimDir>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function runToggle(reduced: boolean, commit: () => void) {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    if (!reduced && labelRef.current) {
      setAnimDir("out");
      const exitTimeout = setTimeout(() => {
        commit();
        setAnimDir("in");
        const enterTimeout = setTimeout(() => setAnimDir(null), 280);
        timeoutsRef.current = [enterTimeout];
      }, 160);
      timeoutsRef.current = [exitTimeout];
    } else {
      commit();
    }
  }

  return { animDir, labelRef, runToggle };
}
