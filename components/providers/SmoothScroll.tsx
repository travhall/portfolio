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
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/components/ui/ripple';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

/** Access the Lenis instance from any child component. */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  // Stored in a ref to avoid triggering a re-render on mount, and to
  // sidestep the react-hooks/set-state-in-effect rule (Lenis is an external
  // system — not React state). We still need the context value to update
  // synchronously so a separate useState drives the Provider value.
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  // SmoothScroll is a root-layout singleton — it mounts once and survives
  // every client-side route change, so the Lenis instance below is created
  // exactly once. Lenis's own autoResize (a debounced ResizeObserver on
  // document.documentElement) doesn't reliably catch the height change when
  // navigating between routes of very different length: its cached
  // dimensions can stay pinned to the shorter page, hard-capping the scroll
  // limit on the page you land on next. Re-sync explicitly on every
  // pathname change, after the new route's content has painted.
  useEffect(() => {
    const instance = lenisRef.current;
    if (!instance) return;
    const id = requestAnimationFrame(() => {
      instance.resize();
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  useEffect(() => {
    // Custom inertial scrolling is a motion effect, not just a convenience —
    // skip it entirely for prefers-reduced-motion and fall back to native
    // (instant) scrolling. ScrollTrigger still works without Lenis driving
    // it; it just reads window.scrollY directly.
    if (prefersReducedMotion()) return;

    const instance = new Lenis({
      duration:    1.2,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenisRef.current = instance;
    // Update state so the context value propagates to children.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    instance.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // ScrollTrigger measures element positions before Lenis is active (in
    // useLayoutEffect). Refresh here so all trigger start/end points are
    // recalculated with Lenis driving scroll.
    ScrollTrigger.refresh();

    // Re-sync Lenis's scroll limit after all subresources (images, fonts)
    // have loaded and the final document height is known. Without this,
    // Lenis can cap scrolling at an earlier position if layout settled
    // after the instance was created.
    const handleLoad = () => {
      instance.resize();
      ScrollTrigger.refresh();
    };
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
