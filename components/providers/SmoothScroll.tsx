'use client';

/**
 * SmoothScroll — Lenis smooth-scroll provider.
 *
 * Wraps the app in a Lenis instance and exposes it via context so child
 * components (e.g. MenuOverlay) can pause/resume scrolling on demand.
 *
 * Lenis drives the GSAP ticker (instead of its own rAF loop) and notifies
 * ScrollTrigger on every scroll tick — this keeps any ScrollTrigger-based
 * pins/scrub animations (e.g. HeroSection's pinned hero) in sync with
 * Lenis's smoothed scroll position.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

/** Access the Lenis instance from any child component. */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      duration:    1.2,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    setLenis(instance);

    instance.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
