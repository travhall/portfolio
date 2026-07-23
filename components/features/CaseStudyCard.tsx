"use client";

// CaseStudyCard — one project card: image, eyebrow, headline. Shared between
// the case-study page's "Related Projects" nav (CaseStudyNav.tsx) and the
// /work archive grid (app/work/page.tsx) — same card, two contexts, per the
// brief that /work should reuse whatever the related-projects nav builds.
//
// Hover (chromatic-aberration wave), entrance (scroll-triggered, staggered
// reveal), and exit (click-triggered wipe before navigating) all reuse
// FeatureWipe.tsx's row image / CaseStudyHero.tsx's hero image mechanics —
// see those files for the patterns being mirrored here. Unlike FeatureWipe
// (one component owning N rows' refs in arrays), each CaseStudyCard owns its
// own single IntersectionObserver and MediaGL instance — this component is
// mounted standalone, once per card, in two different parent grids with no
// shared state between cards.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type MouseEvent,
} from "react";
import { useTransitionRouter } from "next-view-transitions";
import { gsap } from "gsap";
import type { CaseStudy } from "@/lib/case-studies";
import { createTextReveal } from "@/lib/text-reveal";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { MediaGL } from "@/lib/media-gl";

// Matches FeatureWipe.tsx's / CaseStudyHero.tsx's own IMG_INTENSITY exactly,
// for visual consistency. Not imported/shared — see plans/033's own notes on
// why a third duplicate is a reasonable extraction trigger for a *future*
// plan, not this one.
const IMG_INTENSITY = 1.8;

const HIDDEN_CLIP = "inset(0% 0% 0% 100%)";
const VISIBLE_CLIP = "inset(0% 0% 0% 0%)";

// Cross-card entrance stagger, keyed off each card's position in its parent
// grid (passed in as `index`) — capped so a long list doesn't accumulate an
// ever-growing delay for cards far down the page. Each card's own
// IntersectionObserver still gates *when* its entrance starts; this only
// staggers cards that happen to become visible in the same scroll frame
// (e.g. one row of a grid). Design choice, not copied from elsewhere —
// retune freely if the stagger reads too fast/slow.
const STAGGER_STEP = 0.08;
const STAGGER_CAP = 3;

interface Props {
  study: CaseStudy;
  /** This card's position in its parent's list — drives the entrance
   *  stagger delay. Both call sites pass their .map() index. */
  index: number;
  /** Called once when this card's own click starts its exit, with the
   *  href it's navigating to — lets the owning grid
   *  (CaseStudyCardGrid) notify every page-level exit observer (sibling
   *  cards, CaseStudyBody, the back-home button, the site footer — see
   *  lib/page-exit.ts's notifyExitObservers, plan 037), not just this
   *  card's own siblings. Not called when this card's own exit is
   *  triggered externally via playExit() itself (the page-level-exit
   *  path, plan 034) — that path is already "someone else decided I
   *  should exit," no further fan-out needed from here. */
  onExitStart?: (href: string) => void;
}

export interface CaseStudyCardHandle {
  /** Plays this card's exit animation without navigating — for a
   *  page-level exit (e.g. the "back home" button or topbar wordmark)
   *  triggered from outside this card, via lib/page-exit.ts's exit-observer
   *  registry. See CaseStudyNav.tsx, which collects these into a ref array
   *  and registers one observer that calls every card's playExit(). cSpell:ignore wordmark topbar unrequested */
  playExit: () => void;
}

export const CaseStudyCard = forwardRef<CaseStudyCardHandle, Props>(
  function CaseStudyCard({ study, index, onExitStart }, ref) {
    const linkRef = useRef<HTMLAnchorElement>(null);
    const mediaRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const eyebrowInnerRef = useRef<HTMLSpanElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const glRef = useRef<MediaGL | null>(null);
    const revealTlRef = useRef<gsap.core.Timeline | null>(null);
    const isExitingRef = useRef(false);
    const router = useTransitionRouter();

    // ── Entrance: scroll-triggered, staggered reveal ──────────────────────
    useLayoutEffect(() => {
      if (study.comingSoon || prefersReducedMotion()) return;

      const mediaEl = mediaRef.current;
      const titleEl = titleRef.current;
      const eyebrowInner = eyebrowInnerRef.current;
      const observeTarget = linkRef.current;
      if (!mediaEl || !titleEl || !observeTarget) return;

      if (eyebrowInner) gsap.set(eyebrowInner, { opacity: 0, x: -14 });
      gsap.set(mediaEl, { clipPath: HIDDEN_CLIP });

      const reveal = createTextReveal(titleEl, {
        duration: 0.75,
        stagger: 0.5,
      });
      revealTlRef.current = reveal.tl;

      let cancelled = false;
      reveal.ready.then(() => {
        if (cancelled) return;
        if (eyebrowInner) {
          reveal.tl.to(
            eyebrowInner,
            { opacity: 1, x: 0, ease: "power2.out", duration: 0.5 },
            0,
          );
        }
        reveal.tl.to(
          mediaEl,
          { clipPath: VISIBLE_CLIP, ease: "power3.out", duration: 0.9 },
          0.1,
        );
        // Chromatic-aberration burst, synced with the clip-path reveal above —
        // starts at max aberration, eases to crisp. Matches FeatureWipe.tsx's
        // row-0 entrance / CaseStudyHero.tsx's hero entrance exactly.
        const burst = { vel: 1 };
        reveal.tl.to(
          burst,
          {
            vel: 0,
            duration: 1.0,
            ease: "power2.out",
            onUpdate: () => glRef.current?.setScrollState(burst.vel, 0.5),
          },
          0.1,
        );
      });

      // See plans/033's "Reference 2" — the tween-building .then() above
      // resolves well before this observer can plausibly fire; the play call
      // below is deliberately NOT wrapped in a second reveal.ready.then(...).
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry.isIntersecting || cancelled) return;
          observer.disconnect();
          const delay = Math.min(index, STAGGER_CAP) * STAGGER_STEP;
          gsap.delayedCall(delay, () => reveal.tl.play());
        },
        { threshold: 0.2 },
      );
      observer.observe(observeTarget);

      return () => {
        cancelled = true;
        observer.disconnect();
        revealTlRef.current = null;
        reveal.cleanup();
      };
    }, [study.comingSoon, index]);

    // ── Hover: WebGL chromatic-aberration wave ─────────────────────────────
    useEffect(() => {
      if (study.comingSoon || prefersReducedMotion()) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const gl = new MediaGL(canvas, {
        src: study.image,
        effect: "parallax",
        intensity: IMG_INTENSITY,
        // Only this card's own entrance/exit burst tweens should ever drive
        // the aberration — externalScroll disables MediaGL's internal
        // window-scroll listener, which would otherwise also react to page
        // scroll and produce an unrequested continuous effect.
        externalScroll: true,
        onReady: () => mediaRef.current?.classList.add("is-gl"),
      });
      glRef.current = gl;
      // Hover origin: bottom-center — the edge nearest the eyebrow/title
      // stacked directly below the image. Unlike FeatureWipe's rows (image
      // beside text, origin keyed off left/right), this card's layout is
      // vertical, so the analogous "nearest the text" edge is the bottom.
      gl.setOrigin(0.5, 1);

      return () => {
        gl.dispose();
        glRef.current = null;
      };
    }, [study.comingSoon, study.image]);

    // ── Exit: click-triggered wipe before navigating, OR triggered
    // externally (playExit, below) by a page-level exit that does NOT
    // navigate — CaseStudyHero's own exit already owns that single
    // router.push. Both paths share the same tween; only the presence of
    // onComplete differs.
    const buildExitTimeline = (onComplete?: () => void) => {
      // Jump a mid-flight entrance to its completed state first — the exit
      // should always animate away from a fully-revealed card, matching
      // CaseStudyHero.tsx's exitHome.
      revealTlRef.current?.progress(1);

      if (isExitingRef.current) return;
      isExitingRef.current = true;

      if (prefersReducedMotion()) {
        onComplete?.();
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.in" }, onComplete });

      const chars = titleRef.current?.querySelectorAll(".char-inner");
      if (chars && chars.length > 0) {
        tl.to(
          chars,
          {
            yPercent: 105,
            duration: 0.45,
            stagger: { amount: 0.2, from: "end" },
          },
          0,
        );
      }
      if (eyebrowInnerRef.current) {
        tl.to(
          eyebrowInnerRef.current,
          { opacity: 0, x: -14, duration: 0.35 },
          0,
        );
      }
      if (mediaRef.current) {
        tl.to(mediaRef.current, { clipPath: HIDDEN_CLIP, duration: 0.6 }, 0);
        // Chromatic-aberration burst on exit — the entrance's mirror: starts
        // crisp, ramps up as the image clips closed. Matches
        // CaseStudyHero.tsx's exitHome exactly.
        const burst = { vel: 0 };
        tl.to(
          burst,
          {
            vel: 1,
            duration: 0.6,
            ease: "power2.in",
            onUpdate: () => glRef.current?.setScrollState(burst.vel, 0.5),
          },
          0,
        );
      }
    };

    useImperativeHandle(ref, () => ({
      playExit: () => buildExitTimeline(),
    }));

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
      const href = `/work/${study.slug}`;
      // buildExitTimeline MUST run before onExitStart: it's what claims
      // isExitingRef and wires this card's own navigation. onExitStart (via
      // CaseStudyCardGrid's own registered observer, plan 034) loops back
      // over EVERY card including this one — calling it first would let
      // that loop's playExit() claim isExitingRef via a no-onComplete call
      // before this line ever runs, silently dropping navigation. Reversing
      // this order is the one thing plan 037 depends on getting right — see
      // that plan's "Why this matters" for the full trace.
      buildExitTimeline(() => router.push(href));
      onExitStart?.(href);
    };

    if (study.comingSoon) {
      return (
        <div className="case-card case-card--disabled" aria-disabled="true">
          <div
            className="case-card__media case-card__media--empty"
            aria-hidden="true"
          />
          <p className="type-eyebrow text-ink-faint case-card__eyebrow">
            {study.eyebrow}
          </p>
          <h3 className="type-h3 text-ink-muted case-card__title">
            {study.headline}
          </h3>
          <p className="type-small text-ink-faint">Coming soon</p>
        </div>
      );
    }

    return (
      <a
        ref={linkRef}
        href={`/work/${study.slug}`}
        className="case-card"
        onClick={handleClick}
        onMouseEnter={() => glRef.current?.setHover(true)}
        onMouseLeave={() => glRef.current?.setHover(false)}
        onFocus={() => glRef.current?.setHover(true)}
        onBlur={() => glRef.current?.setHover(false)}
      >
        <div ref={mediaRef} className="case-card__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={study.image}
            alt={study.imageAlt ?? ""}
            className="case-card__img"
          />
          <canvas
            ref={canvasRef}
            className="case-card__canvas"
            aria-hidden="true"
          />
        </div>
        <p className="type-eyebrow text-ink-muted case-card__eyebrow">
          <span ref={eyebrowInnerRef} className="eyebrow-inner">
            {study.eyebrow}
          </span>
        </p>
        <h3 ref={titleRef} className="type-h3 text-ink case-card__title">
          {study.headline}
        </h3>
      </a>
    );
  },
);
