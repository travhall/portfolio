'use client';

/**
 * SmoothScroll — Lenis smooth-scroll provider.
 *
 * Wraps the app in a Lenis instance and exposes it via context so child
 * components (e.g. MenuOverlay) can pause/resume scrolling on demand.
 *
 * The RAF loop is tied to Lenis's own raf() — no separate GSAP ticker
 * needed unless we add ScrollTrigger later.
 */

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';

const LenisContext = createContext<Lenis | null>(null);

/** Access the Lenis instance from any child component. */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      duration:    1.2,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    setLenis(instance);

    function animate(time: number) {
      instance.raf(time);
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      instance.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
