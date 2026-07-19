"use client";

/**
 * CaseStudyHero — the case-study page's animated header: eyebrow, headline,
 * hero image, and the "back to home" CTA. Plays an entrance reveal on mount
 * and its exact inverse before navigating home, reusing the same mechanics
 * FeatureWipe's row entrance/exit and IntroSection's hero statement already
 * use (see components/features/FeatureWipe.tsx's row-0 image reveal +
 * runExit, and lib/text-reveal.ts). Supersedes the old BackHomeButton — this
 * component owns the "back home" navigation itself so it can play the exit
 * animation first.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { createTextReveal } from "@/lib/text-reveal";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { waitForActiveViewTransition } from "@/lib/view-transition";
import { registerPageExit } from "@/lib/page-exit";
import { MediaGL } from "@/lib/media-gl";

// Wipe direction for the hero image — always from the right, since a single
// hero (unlike FeatureWipe's alternating rows) has no per-item "side" to key
// off. Entrance and exit both use this same value (exit is the entrance
// played backward), matching FeatureWipe's own clip-path shape:
// inset(top right bottom left).
const HIDDEN_CLIP = "inset(0% 0% 0% 100%)";
const VISIBLE_CLIP = "inset(0% 0% 0% 0%)";

// Matches FeatureWipe.tsx's IMG_INTENSITY exactly, for visual consistency
// with the reference implementation this effect is copied from. Not
// imported directly — that constant is module-local (not exported) there,
// and exporting it just for this one shared number isn't worth the change
// to an unrelated file.
const IMG_INTENSITY = 1.8;

interface Props {
  eyebrow: string;
  headline: string;
  image: string;
  imageAlt?: string;
}

export function CaseStudyHero({ eyebrow, headline, image, imageAlt }: Props) {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const eyebrowInnerRef = useRef<HTMLSpanElement>(null);
  const imageColRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<MediaGL | null>(null);
  const isExitingRef = useRef(false);
  const revealTlRef = useRef<gsap.core.Timeline | null>(null);
  const router = useTransitionRouter();

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;

    const headlineEl = headlineRef.current;
    const eyebrowInner = eyebrowInnerRef.current;
    const imageCol = imageColRef.current;
    if (!headlineEl) return;

    if (eyebrowInner) gsap.set(eyebrowInner, { opacity: 0, x: -14 });
    if (imageCol) gsap.set(imageCol, { clipPath: HIDDEN_CLIP });

    const reveal = createTextReveal(headlineEl, {
      duration: 0.75,
      stagger: 0.5,
    });
    revealTlRef.current = reveal.tl;

    let cancelled = false;
    Promise.all([reveal.ready, waitForActiveViewTransition()]).then(() => {
      if (cancelled) return;
      if (eyebrowInner) {
        reveal.tl.to(
          eyebrowInner,
          { opacity: 1, x: 0, ease: "power2.out", duration: 0.5 },
          0,
        );
      }
      if (imageCol) {
        reveal.tl.to(
          imageCol,
          { clipPath: VISIBLE_CLIP, ease: "power3.out", duration: 0.9 },
          0.1,
        );
        // Chromatic-aberration burst, synced with the clip-path reveal above
        // — starts at max aberration, eases to crisp, matching
        // FeatureWipe.tsx's row-0 entrance exactly (duration deliberately a
        // touch longer than the clip-path reveal so the aberration lingers
        // slightly past the wipe completing).
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
      }
      reveal.tl.play();
    });

    return () => {
      cancelled = true;
      revealTlRef.current = null;
      reveal.cleanup();
    };
  }, []);

  // WebGL chromatic-aberration layer for the hero image, matching
  // FeatureWipe's row images. Only one image on this page (unlike
  // FeatureWipe's list), so no IntersectionObserver lazy-loading is needed —
  // just instantiate on mount. Skipped entirely under reduced motion,
  // matching FeatureWipe's own convention: the shader's ambient noise-driven
  // drift runs off u_time continuously regardless of u_vel/u_scroll, so the
  // safest way to guarantee zero motion is to never create the canvas, not
  // to rely on the shader's partial reduced-motion accommodations.
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = new MediaGL(canvas, {
      src: image,
      effect: "parallax",
      intensity: IMG_INTENSITY,
      // Only this component's own entrance/exit burst tweens should ever
      // drive the aberration — externalScroll disables MediaGL's internal
      // window-scroll listener, which would otherwise also react to the
      // page's own scroll position and produce an unrequested continuous
      // effect while scrolling the case-study page.
      externalScroll: true,
      onReady: () => imageColRef.current?.classList.add("is-gl"),
    });
    glRef.current = gl;

    return () => {
      gl.dispose();
      glRef.current = null;
    };
  }, [image]);

  const exitHome = (href: string) => {
    // If the entrance is still mid-flight (e.g. the user clicked "back home"
    // quickly after a client-side arrival), jump it to its completed state
    // first — the exit should always animate away from a fully-revealed
    // hero, never from a partially-revealed mid-animation frame. No-op if
    // the entrance already finished naturally, or never ran (reduced
    // motion).
    revealTlRef.current?.progress(1);

    if (isExitingRef.current) return;
    isExitingRef.current = true;

    if (prefersReducedMotion()) {
      router.push(href);
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: () => router.push(href),
    });

    const chars = headlineRef.current?.querySelectorAll(".char-inner");
    if (chars && chars.length > 0) {
      tl.to(
        chars,
        { yPercent: 105, duration: 0.45, stagger: { amount: 0.2, from: "end" } },
        0,
      );
    }
    if (eyebrowInnerRef.current) {
      tl.to(eyebrowInnerRef.current, { opacity: 0, x: -14, duration: 0.35 }, 0);
    }
    if (imageColRef.current) {
      tl.to(imageColRef.current, { clipPath: HIDDEN_CLIP, duration: 0.6 }, 0);
      // Chromatic-aberration burst on exit — the entrance's mirror: starts
      // crisp, ramps up to max aberration as the image clips closed. No
      // direct FeatureWipe precedent (its runExit never drives one) — this
      // is a reasoned design choice matching the "reveal/hide" symmetry of
      // what was asked, not a copy of proven-elsewhere code. If it doesn't
      // look right, the ease/duration here are the first things to retune,
      // not the mechanism.
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

  useEffect(() => {
    // exitHome is intentionally omitted: it only closes over refs and the
    // stable router value, never props/state, so it doesn't need to be
    // treated as changing between renders for this registration effect.
    return registerPageExit((href) => exitHome(href));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <p className="type-eyebrow text-ink-muted cs-hero-eyebrow">
        <span ref={eyebrowInnerRef} className="eyebrow-inner">
          {eyebrow}
        </span>
      </p>
      <h1 ref={headlineRef} className="type-h1 text-ink cs-hero-headline">
        {headline}
      </h1>
      <div ref={imageColRef} className="cs-hero-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={imageAlt ?? ""}
          width={756}
          height={910}
          className="cs-hero-image__img"
        />
        <canvas ref={canvasRef} className="cs-hero-image__canvas" aria-hidden="true" />
      </div>
      <Button
        variant="ghost"
        href="/"
        onClick={(e) => {
          // Leave modifier / non-primary clicks alone so "open in new tab",
          // "open in new window", etc. still work — same passthrough
          // BackHomeButton and FeatureWipe.tsx's case-study buttons use.
          if (
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey ||
            e.button !== 0
          ) {
            return;
          }
          e.preventDefault();
          exitHome("/");
        }}
      >
        Let&apos;s get you back home
      </Button>
    </>
  );
}
