"use client";

/**
 * FeatureWipe — USP section scroll mechanic with clip-path wipe effects.
 * Key mechanic:
 *   - The <section> has large top + bottom padding acting as scroll dwell buffers.
 *   - Rows are stacked naturally with grid layout (NOT 100vh).
 *   - Text divs inside each row are position:fixed, centered on the viewport.
 *   - A clip-path mask on the scrolling parent (.clipCell) paint-clips the fixed
 *     text to its own bounding box, creating a beautiful wipe reveal as the row
 *     scrolls past.
 *   - A single GSAP ScrollTrigger timeline coordinates opacity, Y drift, and
 *     line-by-line SplitText reveals across all items. Opacity only, not
 *     autoAlpha — every row's button must stay in the focus order and
 *     accessibility tree even while visually faded, so Tab can reach all of
 *     them; pointer-events is toggled separately to keep clicks exclusive
 *     to whichever row is actually visible (see onFocus below for how
 *     keyboard focus pulls an off-screen row into view via Lenis).
 *   - Each image column is an OGL canvas running the same chromatic-aberration
 *     parallax shader as the hero, driven per-row by its own ScrollTrigger.
 */

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/Button";
import { MediaGL } from "@/lib/media-gl";
import { createTextReveal } from "@/lib/text-reveal";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { useLenis } from "@/components/providers/SmoothScroll";
import { useTheme, resolveTheme } from "@/lib/use-theme";
import { useMotionPref, readMotionPref } from "@/lib/motion-pref";
import { DESKTOP_BP } from "@/lib/breakpoints";
import { ENTRANCE_DELAY } from "@/lib/entrance-timing";
import {
  waitForActiveViewTransition,
  registerPreTransitionHook,
} from "@/lib/view-transition";
import type { CaseStudy } from "@/lib/case-studies";
import { resolveThemeVars } from "@/lib/case-study-theme";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Chromatic aberration intensity — higher than 1.5 default to compensate
// for the smaller canvas size relative to the hero. At 1.8 the channel
// separation is clearly visible on fast scrolls without being distracting
// at rest.
const IMG_INTENSITY = 1.8;

function imageFor(f: CaseStudy, theme: "light" | "dark") {
  return theme === "dark" && f.imageDark ? f.imageDark : f.image;
}

interface Props {
  features: CaseStudy[];
  id?: string;
}

export function FeatureWipe({ features, id }: Props) {
  const lenis = useLenis();
  const router = useTransitionRouter();
  const theme = useTheme();
  const motionPref = useMotionPref();
  const sectionRef = useRef<HTMLElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]); // .mediaInner wrappers
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]); // GL canvases
  const headlineRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const glInstancesRef = useRef<(MediaGL | null)[]>([]); // one per feature

  // Scroll-progress target for each row's "fully revealed" window (centers[i]
  // below) plus the main timeline's ScrollTrigger, so the onFocus handler can
  // scroll to the exact page position the timeline considers "active" for
  // that row — not just "row roughly in viewport", which can land mid-fade.
  const centersRef = useRef<number[]>([]);
  const mainTriggerRef = useRef<ScrollTrigger | null>(null);
  // First-image entrance reveal plays once per mount (guarded so a resize
  // re-init doesn't replay it — see the row-0 branch in the timeline effect).
  const entrancePlayedRef = useRef(false);
  // Mobile per-row entrance (see the timeline effect's initMobileEntrances) —
  // one flag per row, a useRef (not an effect-local var) so it survives a
  // motionPref/features dep change without replaying an already-seen row,
  // same reasoning as entrancePlayedRef above.
  const mobileEntrancePlayedRef = useRef<boolean[]>([]);
  // True once a page-exit animation has begun, so a second click during the
  // exit can't start a competing timeline or fire a second router.push.
  const isExitingRef = useRef(false);

  // ── Timeline effect ─────────────────────────────────────────────────────
  // SplitText + the scrubbed GSAP timeline. Deliberately excludes `theme`
  // from its deps — none of this (char splits, fade/drift timing, centers)
  // depends on light vs. dark, so toggling theme must not re-run it. See the
  // lazy-media effect below for the theme-dependent half (image src + ink
  // color), which is cheap to re-run on its own.
  useLayoutEffect(() => {
    // Keep arrays matching current features length (trimmed here, not during
    // render, to satisfy react-hooks/refs)
    bandRefs.current = bandRefs.current.slice(0, features.length);
    textRefs.current = textRefs.current.slice(0, features.length);
    headlineRefs.current = headlineRefs.current.slice(0, features.length);

    let ctx: gsap.Context;
    let splits: SplitText[] = [];
    let perFeatureChars: Element[][] = [];
    let currentWidth = window.innerWidth;
    // Mobile entrance state — see initMobileEntrances/cleanupMobileEntrances
    // below. Kept outside init() (like ctx/splits above) so repeated resize-
    // triggered init() calls within the same effect lifetime share them.
    let mobileObserver: IntersectionObserver | null = null;
    let mobileReveals: (ReturnType<typeof createTextReveal> | null)[] = [];
    // readMotionPref() (direct DOM read), not the motionPref closure value —
    // same reasoning as resolveTheme() in lib/use-theme.ts: on the very first
    // mount, useSyncExternalStore's getServerSnapshot() must lie and report
    // "on" to satisfy hydration, even though the anti-FOUC script in
    // app/layout.tsx has already set data-motion="off" on <html> before this
    // effect ever runs. Trusting the lagging `motionPref` value here let this
    // effect's first pass wrongly spin up the full GSAP/IntersectionObserver
    // setup, which the resync's second pass then had to tear down — any row
    // whose IntersectionObserver callback fired late (after teardown) was
    // left with an orphaned MediaGL instance that the next effect run's
    // `if (glInstancesRef.current[i]) return;` guard then treated as already
    // active forever, permanently hiding that row's photo behind a never-
    // drawn canvas. Reading the DOM directly sidesteps the lag entirely.
    const reduced = readMotionPref() === "off";

    // ── Mobile entrance (below DESKTOP_BP) ─────────────────────────────────
    // Desktop's scroll-scrubbed wipe (fixed-position text + clip-path mask
    // keyed to scroll position) doesn't map onto mobile's stacked flex
    // layout, so mobile gets its own, simpler mechanism instead: each row
    // plays a one-time entrance — eyebrow slide, headline char cascade
    // (createTextReveal, the same helper CaseStudyHero.tsx uses), image
    // un-clip, and a matching chromatic-aberration burst — triggered by an
    // IntersectionObserver as the row scrolls into view, rather than a
    // ScrollTrigger scrub. Row 0 gets ENTRANCE_DELAY.firstImage so it doesn't
    // race the wordmark/hero-statement entrance still playing elsewhere.

    // Hides eyebrow/button/image and builds (but does not play) this row's
    // reveal timeline. .fw-text-fixed's own opacity comes from the base CSS
    // rule's default (opacity: 0, pre-JS flash prevention) — flipped to 1
    // here since its children below are all independently still hidden, so
    // nothing leaks visible before the timeline plays. cSpell:ignore wordmark
    function setupMobileEntrance(i: number) {
      const textEl = textRefs.current[i];
      const headlineEl = headlineRefs.current[i];
      if (!textEl || !headlineEl) return null;

      const f = features[i];
      const eyebrowInner = textEl.querySelector<HTMLElement>(".eyebrow-inner");
      const buttonEl = textEl.querySelector<HTMLElement>(".fw-button");
      const mediaInner = mediaRefs.current[i];
      const mediaCol = mediaInner?.parentElement as HTMLElement | null;

      gsap.set(textEl, { opacity: 1 });
      if (eyebrowInner) gsap.set(eyebrowInner, { opacity: 0, x: -14 });
      if (buttonEl) gsap.set(buttonEl, { opacity: 0, y: 20 });
      if (mediaCol) {
        const exitRight = f.side === "right";
        gsap.set(mediaCol, {
          clipPath: exitRight ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
        });
      }

      const reveal = createTextReveal(headlineEl, {
        duration: 0.75,
        stagger: 0.5,
      });

      reveal.ready.then(() => {
        if (eyebrowInner) {
          reveal.tl.to(
            eyebrowInner,
            { opacity: 1, x: 0, ease: "power2.out", duration: 0.5 },
            0,
          );
        }
        if (buttonEl) {
          reveal.tl.to(
            buttonEl,
            { opacity: 1, y: 0, ease: "power2.out", duration: 0.5 },
            0.15,
          );
        }
        if (mediaCol) {
          reveal.tl.to(
            mediaCol,
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "power3.out",
              duration: 0.9,
            },
            0.1,
          );
          // Chromatic-aberration burst, matching the desktop row-0 entrance
          // and CaseStudyHero's own image reveal exactly.
          const burst = { vel: 1 };
          reveal.tl.to(
            burst,
            {
              vel: 0,
              duration: 1.0,
              ease: "power2.out",
              onUpdate: () =>
                glInstancesRef.current[i]?.setScrollState(burst.vel, 0.5),
            },
            0.1,
          );
        }
      });

      return reveal;
    }

    // Forces a row straight to its fully-revealed end state, with no
    // animation — used for a row whose entrance already played (per
    // mobileEntrancePlayedRef) by the time initMobileEntrances runs again.
    // In practice this is mainly a React StrictMode dev safety net: the
    // double-invoked mount/cleanup/mount can flip the ref true and then kill
    // the in-flight reveal before it lands, and without this the row would
    // otherwise be silently skipped (setupMobileEntrance never called again,
    // per the ref guard) and left stuck mid-animation from the aborted first
    // pass. Mirrors the desktop row-0 entrance's own "already played? just
    // show it" else-branch below.
    function snapRevealed(i: number) {
      const textEl = textRefs.current[i];
      if (!textEl) return;
      gsap.set(textEl, { opacity: 1 });
      const eyebrowInner = textEl.querySelector<HTMLElement>(".eyebrow-inner");
      if (eyebrowInner) gsap.set(eyebrowInner, { opacity: 1, x: 0 });
      const buttonEl = textEl.querySelector<HTMLElement>(".fw-button");
      if (buttonEl) gsap.set(buttonEl, { opacity: 1, y: 0 });
      const mediaCol = mediaRefs.current[i]
        ?.parentElement as HTMLElement | null;
      if (mediaCol) gsap.set(mediaCol, { clipPath: "inset(0% 0% 0% 0%)" });
    }

    // Disconnects the observer and reverts any not-yet-played reveals.
    // Reverting an already-*played* reveal is harmless — createTextReveal's
    // cleanup() just swaps the finished, fully-visible split back to plain
    // text, which looks identical once the cascade has landed — so this is
    // safe to call unconditionally whenever mobile entrance state needs to
    // be torn down (leaving mobile for desktop, reduced motion kicking in
    // mid-session, or effect teardown), not just on already-played rows.
    function cleanupMobileEntrances() {
      mobileObserver?.disconnect();
      mobileObserver = null;
      mobileReveals.forEach((r) => r?.cleanup());
      mobileReveals = [];
    }

    function initMobileEntrances() {
      cleanupMobileEntrances();
      mobileReveals = bandRefs.current.map((_, i) => {
        if (mobileEntrancePlayedRef.current[i]) {
          snapRevealed(i);
          return null;
        }
        return setupMobileEntrance(i);
      });

      mobileObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const i = bandRefs.current.indexOf(entry.target as HTMLDivElement);
            if (i === -1 || !entry.isIntersecting) return;
            if (mobileEntrancePlayedRef.current[i]) return;
            mobileEntrancePlayedRef.current[i] = true;
            mobileObserver?.unobserve(entry.target);

            const reveal = mobileReveals[i];
            if (!reveal) return;
            if (i === 0) {
              gsap.delayedCall(ENTRANCE_DELAY.firstImage, () =>
                reveal.tl.play(),
              );
            } else {
              reveal.tl.play();
            }
          });
        },
        { threshold: 0.2 },
      );
      bandRefs.current.forEach((el) => el && mobileObserver?.observe(el));
    }

    function init() {
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
      splits = [];
      perFeatureChars = [];

      if (reduced) {
        // No scroll-driven cascade, no mobile entrance either — CSS
        // (layout.css, the reduced-motion + data-motion="off" blocks)
        // collapses every row to the same static, fully-visible stacked
        // layout regardless of width.
        cleanupMobileEntrances();
        centersRef.current = [];
        mainTriggerRef.current = null;
        return;
      }

      const isDesktop = window.innerWidth >= DESKTOP_BP;
      if (!isDesktop) {
        // No scroll-progress target to reuse below 900px — see
        // initMobileEntrances above for mobile's own per-row entrance.
        centersRef.current = [];
        mainTriggerRef.current = null;
        initMobileEntrances();
        return;
      }

      // Reaching this point means desktop — tear down any mobile entrance
      // state left over from a resize that just crossed the breakpoint.
      cleanupMobileEntrances();

      ctx = gsap.context(() => {
        // SplitText on headlines — lines as overflow:hidden masks, chars as
        // the animated children. Structure: .line-mask > .char-inner[]
        headlineRefs.current.forEach((headlineEl) => {
          if (!headlineEl) {
            perFeatureChars.push([]);
            return;
          }
          const split = new SplitText(headlineEl, {
            type: "lines,chars",
            linesClass: "line-mask",
            charsClass: "char-inner",
          });
          splits.push(split);
          perFeatureChars.push(split.chars as unknown as Element[]);
        });

        // Initial states — chars rise from below clip mask,
        // eyebrow slides from left, button fades up
        // opacity only — not autoAlpha. autoAlpha also toggles visibility,
        // which would pull every row but the active one out of the focus
        // order and the accessibility tree. Visual occlusion of inactive
        // rows is handled entirely by .fw-clip-cell's off-screen clip-path.
        //
        // pointer-events is still toggled explicitly (set alongside opacity
        // below, not here on .fw-button) — every row shares the same fixed,
        // viewport-centred screen position, so without this only the
        // topmost-in-DOM row's button would ever receive clicks/taps.
        gsap.set(textRefs.current, {
          opacity: 0,
          y: 80,
          pointerEvents: "none",
        });
        headlineRefs.current.forEach((_, idx) => {
          const chars = perFeatureChars[idx] || [];
          if (chars.length > 0) gsap.set(chars, { yPercent: 105 });
          const eyebrowInner =
            textRefs.current[idx]?.querySelector(".eyebrow-inner");
          if (eyebrowInner) gsap.set(eyebrowInner, { opacity: 0, x: -14 });
          const buttonEl = textRefs.current[idx]?.querySelector(".fw-button");
          if (buttonEl) gsap.set(buttonEl, { opacity: 0 });
        });

        // Main scrubbed timeline
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 52%",
            end: "bottom 50%",
            scrub: true,
          },
        });

        const sectionEl = sectionRef.current;
        if (!sectionEl) return;

        const sectionH = sectionEl.offsetHeight;
        const vh = window.innerHeight;
        const totalScrollDistance = sectionH + vh * 0.02;
        const N = features.length;

        const centers = bandRefs.current.map((rowEl) => {
          if (!rowEl) return 0;
          const rowCenter = rowEl.offsetTop + rowEl.offsetHeight / 2;
          return (rowCenter + vh * 0.02) / totalScrollDistance;
        });
        centersRef.current = centers;
        mainTriggerRef.current = tl.scrollTrigger ?? null;

        for (let i = 0; i < N; i++) {
          const textEl = textRefs.current[i];
          if (!textEl) continue;

          const p_i = centers[i];

          let dist = 0.2;
          if (N > 1) {
            dist =
              i < N - 1
                ? centers[i + 1] - centers[i]
                : centers[i] - centers[i - 1];
          }
          dist = Math.max(dist, 0.05); // guard against collapsed windows

          const fadeInStart = Math.max(0.01, p_i - dist * 0.45);
          const fadeInEnd = p_i - dist * 0.2;
          const fadeInDuration = fadeInEnd - fadeInStart;

          const driftStart = i === 0 ? 0.0 : p_i - dist * 0.5;
          const driftEnd = i === N - 1 ? 1.0 : p_i + dist * 0.5;

          tl.fromTo(
            textEl,
            { y: 24 },
            { y: -24, ease: "none", duration: driftEnd - driftStart },
            driftStart,
          );

          // Snap container visible instantly — char cascade is the headline reveal
          tl.set(textEl, { opacity: 1, pointerEvents: "auto" }, fadeInStart);

          // Eyebrow: slide in from left, ahead of the headline
          const eyebrowInner = textEl.querySelector(".eyebrow-inner");
          if (eyebrowInner) {
            tl.to(
              eyebrowInner,
              {
                opacity: 1,
                x: 0,
                ease: "power2.out",
                duration: fadeInDuration * 0.5,
              },
              fadeInStart,
            );
          }

          // Headline: chars cascade up from clip with a distributed stagger
          const chars = perFeatureChars[i] || [];
          if (chars.length > 0) {
            tl.to(
              chars,
              {
                yPercent: 0,
                ease: "power2.out",
                duration: fadeInDuration * 0.6,
                stagger: { amount: fadeInDuration * 0.3 },
              },
              fadeInStart,
            );
          }

          const buttonEl = textEl.querySelector(".fw-button");
          if (buttonEl) {
            tl.fromTo(
              buttonEl,
              { y: 20, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                ease: "power2.out",
                duration: fadeInDuration * 0.8,
              },
              fadeInStart + fadeInDuration * 0.2,
            );
          }

          if (i < N - 1) {
            const fadeOutStart = p_i + dist * 0.2;
            const fadeOutEnd = p_i + dist * 0.45;
            const fadeOutDuration = fadeOutEnd - fadeOutStart;
            tl.set(textEl, { pointerEvents: "none" }, fadeOutStart);

            // Exit = the entrance text reveal played in reverse: chars fall
            // back down into the clip mask, the eyebrow slides back out left,
            // and the button drops away. Mirrors the .to() calls in the
            // fade-in block above (power2.out → power2.in, target/origin
            // values swapped, char stagger reversed from "end").

            // Headline chars cascade back down into the clip mask
            if (chars.length > 0) {
              tl.to(
                chars,
                {
                  yPercent: 105,
                  ease: "power2.in",
                  duration: fadeOutDuration * 0.6,
                  stagger: { amount: fadeOutDuration * 0.3, from: "end" },
                },
                fadeOutStart,
              );
            }

            // Eyebrow slides back out to the left
            if (eyebrowInner) {
              tl.to(
                eyebrowInner,
                {
                  opacity: 0,
                  x: -14,
                  ease: "power2.in",
                  duration: fadeOutDuration * 0.5,
                },
                fadeOutStart + fadeOutDuration * 0.5,
              );
            }

            // Button drops down and fades
            if (buttonEl) {
              tl.to(
                buttonEl,
                {
                  y: 20,
                  opacity: 0,
                  ease: "power2.in",
                  duration: fadeOutDuration * 0.8,
                },
                fadeOutStart,
              );
            }

            // Hide the container once its contents have fully left
            tl.set(textEl, { opacity: 0 }, fadeOutEnd);
          }
        }

        // Image reveals.
        //   Row 0 — the only image in view on load — plays an entrance reveal
        //     once: the inverse of the page-exit wipe (its media column
        //     un-clips from its outer edge), with a chromatic-aberration burst
        //     that eases out as it lands. It skips the scroll reveal below.
        //   Rows 1+ keep the scroll-scrubbed reveal (inset clips the bottom so
        //     the image rises into frame as its row scrolls up).
        bandRefs.current.forEach((rowEl, idx) => {
          if (!rowEl) return;
          const mediaInner = mediaRefs.current[idx];
          const mediaCol = mediaInner?.parentElement; // .fw-media
          if (!mediaInner || !mediaCol) return;

          if (idx === 0) {
            const exitRight = features[0].side === "right";
            const clipped = exitRight
              ? "inset(0% 0% 0% 100%)"
              : "inset(0% 100% 0% 0%)";
            if (!entrancePlayedRef.current) {
              // gsap.set (synchronous, before paint in this useLayoutEffect)
              // hides it through the delay so the un-clipped image never
              // flashes before the reveal starts.
              gsap.set(mediaCol, { clipPath: clipped });
              const introTl = gsap.timeline({ paused: true });
              introTl.to(
                mediaCol,
                {
                  clipPath: "inset(0% 0% 0% 0%)",
                  ease: "power3.out",
                  duration: 0.9,
                },
                0,
              );
              const burst = { vel: 1 };
              introTl.to(
                burst,
                {
                  vel: 0,
                  duration: 1.0,
                  ease: "power2.out",
                  onUpdate: () =>
                    glInstancesRef.current[0]?.setScrollState(burst.vel, 0.5),
                },
                0,
              );
              // Waits for any in-flight view transition (a client-side
              // navigation arriving at home) to genuinely finish before
              // starting — on a full page load this resolves immediately
              // (no transition exists), so ENTRANCE_DELAY.firstImage below
              // is still the only thing controlling timing there,
              // preserving the existing load sequence exactly. Matches
              // CaseStudyHero.tsx's identical use of this same utility.
              waitForActiveViewTransition().then((hadTransition) => {
                if (disposed) return;
                // Only mark the entrance "played" once we're actually
                // about to play it — not eagerly at the top of this block.
                // A StrictMode dev double-invoke (mount → cleanup → mount)
                // cleans up this exact invocation's `disposed` flag before
                // its own promise resolves, so a superseded invocation
                // never reaches this line; the surviving invocation is the
                // only one that ever marks the ref, and it does so right
                // before it actually animates. See plan 056.
                entrancePlayedRef.current = true;
                // Same reasoning as IntroSection.tsx: a client-side arrival
                // has nothing left to sequence behind (Topbar's reveal
                // never replays on client navigation), so play immediately
                // once the transition has genuinely settled instead of
                // stacking ENTRANCE_DELAY.firstImage on top of it too. cSpell:ignore Topbar
                if (hadTransition) {
                  introTl.play();
                } else {
                  gsap.delayedCall(ENTRANCE_DELAY.firstImage, () =>
                    introTl.play(),
                  );
                }
              });
            } else {
              // A resize re-init after the entrance already played — just show it
              // fully rather than replaying. Explicit set, not clearProps: .fw-media
              // now has a CSS-default hidden clip-path on row 0 (app/layout.css, see
              // plan 025) for the full-page-load flash fix. clearProps would fall
              // through to that CSS default and re-hide the image on every desktop
              // resize after the entrance has already played once.
              gsap.set(mediaCol, { clipPath: "inset(0% 0% 0% 0%)" });
            }
            return;
          }

          gsap.fromTo(
            mediaInner,
            { clipPath: "inset(0% 0% 20% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "power1.out",
              scrollTrigger: {
                trigger: rowEl,
                start: "top 90%",
                end: "top 30%",
                scrub: true,
              },
            },
          );
        });
      }, sectionRef);
    }

    // Split masks are measured at init time; if the display font hasn't
    // loaded yet the line breaks are computed against the fallback font and
    // never recomputed. Defer the first init until fonts are ready so the
    // masks match the final glyph metrics. Resolves immediately on warm cache.
    let fontsReady = true;
    if (typeof document !== "undefined" && document.fonts.status !== "loaded") {
      fontsReady = false;
      document.fonts.ready.then(() => {
        // The cleanup below flips this ref; bail if we unmounted first.
        if (disposed) return;
        init();
      });
    }
    if (fontsReady) init();

    let resizeTimeout: NodeJS.Timeout;
    let disposed = false;
    const handleResize = () => {
      if (window.innerWidth === currentWidth) return;
      currentWidth = window.innerWidth;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(init, 200);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      disposed = true;
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
      cleanupMobileEntrances();
    };
  }, [features, motionPref]);

  // ── Lazy media effect ───────────────────────────────────────────────────
  // GL chromatic-aberration parallax canvases. Depends on `theme` (image src)
  // but not on layout/SplitText, so toggling theme only re-runs this — no
  // GSAP timeline/SplitText churn. Lazy per-row via IntersectionObserver:
  // each row owns one WebGL2 context, and browsers cap concurrent contexts
  // (mobile Safari ~8), so only rows near the viewport get a live context.
  useLayoutEffect(() => {
    mediaRefs.current = mediaRefs.current.slice(0, features.length);
    canvasRefs.current = canvasRefs.current.slice(0, features.length);
    glInstancesRef.current = glInstancesRef.current.slice(0, features.length);

    const glTriggers: (ReturnType<typeof ScrollTrigger.create> | null)[] =
      features.map(() => null);
    let mediaObserver: IntersectionObserver | null = null;
    // readMotionPref() (direct DOM read), not the motionPref closure value —
    // see the matching comment on the timeline effect above for why the
    // hook's value can lag by one render on first mount, and why that lag
    // specifically causes images to go permanently blank here.
    const reduced = readMotionPref() === "off";

    function disposeRowGL(i: number) {
      glTriggers[i]?.kill();
      glTriggers[i] = null;
      glInstancesRef.current[i]?.dispose();
      glInstancesRef.current[i] = null;
      mediaRefs.current[i]?.classList.remove("is-gl");
    }

    // Instantiate one MediaGL per canvas, driven by a per-row ScrollTrigger.
    // u_vel  ← instantaneous scroll speed, eased by MediaGL's internal spring
    // u_scroll ← 0→1 as the row travels through the viewport
    function initRowGL(i: number) {
      if (glInstancesRef.current[i]) return; // already active
      const f = features[i];
      const canvas = canvasRefs.current[i];
      const rowEl = bandRefs.current[i];
      // resolveTheme() (direct DOM read), not the theme closure value — see
      // its comment in lib/use-theme.ts for why the latter can lag by one
      // render on first mount and flash the wrong photo into the texture.
      const src = imageFor(f, resolveTheme());
      if (!canvas || !src || !rowEl) return;

      const gl = new MediaGL(canvas, {
        src,
        effect: "parallax",
        intensity: IMG_INTENSITY,
        externalScroll: true, // disable internal _measure(), ScrollTrigger drives it
        onReady: () => mediaRefs.current[i]?.classList.add("is-gl"),
      });
      glInstancesRef.current[i] = gl;

      // Hover-wave origin: the image edge nearest the "View Case Study"
      // button (always in the centre text column) — left edge when the
      // photo sits on the right (f.side === "right"), right edge when it
      // sits on the left. See onMouseEnter/Leave on the button below.
      gl.setOrigin(f.side === "right" ? 0 : 1, 0.5);

      let lastY = window.scrollY;

      // Trigger is created outside gsap.context() — killed explicitly in
      // disposeRowGL instead.
      glTriggers[i] = ScrollTrigger.create({
        trigger: rowEl,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const y = window.scrollY;
          const dy = y - lastY;
          lastY = y;
          // Divide by 30 not 60 — gives 2× stronger velocity signal
          // so chromatic aberration reads clearly at normal scroll speeds
          const vel = Math.max(-1, Math.min(1, dy / 30));
          gl.setScrollState(vel, self.progress);
        },
      });
    }

    function disposeAllMedia() {
      features.forEach((_, i) => {
        disposeRowGL(i);
      });
    }

    // Lazily inits/disposes GL per row as it nears the viewport, instead of
    // creating up to N WebGL contexts up front.
    function setupLazyMedia() {
      mediaObserver?.disconnect();

      mediaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const i = bandRefs.current.indexOf(entry.target as HTMLDivElement);
            if (i === -1) return;
            if (entry.isIntersecting) {
              if (!reduced) initRowGL(i);
            } else {
              if (!reduced) disposeRowGL(i);
            }
          });
        },
        { rootMargin: "50% 0px" }, // preload/keep alive one viewport-height early
      );
      bandRefs.current.forEach((el) => el && mediaObserver?.observe(el));
    }

    // Always init regardless of breakpoint (images show on mobile too);
    // `reduced` is checked inside the callback above so the observer itself
    // still runs (keeping mediaRefs/canvasRefs in sync) even with motion off.
    setupLazyMedia();

    return () => {
      mediaObserver?.disconnect();
      disposeAllMedia();
    };
  }, [features, theme, motionPref]);

  // Browser back/forward re-entering a case study never runs runExit's click
  // handler below, so the matching row never gets tagged for the fw-brand
  // shared-element morph — it would otherwise just fall back to the generic
  // root cross-fade. This mirrors runExit's tag (line ~800) for that path.
  useLayoutEffect(() => {
    return registerPreTransitionHook(() => {
      // Mirrors runExit's own guard below: under reduced motion the group
      // morph is already disabled entirely (animation: none !important on
      // ::view-transition-group(fw-brand), app/base.css), so there's nothing
      // for this tag to feed. Skipping it also avoids a real side effect —
      // .fw-row__brand's `transition: opacity var(--btn-dur)` (app/layout.css)
      // is a plain CSS transition, not gated by reduced motion itself, so
      // adding .is-exiting below would otherwise animate a visible opacity
      // wipe on every reduced-motion popstate into a case study.
      if (prefersReducedMotion()) return;
      const match = window.location.pathname.match(/^\/work\/([^/]+)\/?$/);
      if (!match) return;
      const i = features.findIndex((f) => f.slug === match[1]);
      const activeRow = i >= 0 ? bandRefs.current[i] : null;
      const brandEl = activeRow?.querySelector<HTMLElement>(".fw-row__brand");
      if (brandEl) brandEl.style.viewTransitionName = "fw-brand";
      // Also force the brand fill visible, same as runExit's is-exiting class
      // below — otherwise .fw-row__brand is opacity:0 at rest (no hover/focus
      // on a popstate) and the old snapshot is transparent, so the color
      // fades IN during the morph instead of holding. Row unmounts with the
      // home page once the transition completes, so no cleanup needed.
      activeRow?.classList.add("is-exiting");
    });
  }, [features]);

  // ── Page-exit animation ──────────────────────────────────────────────────
  // Plays on "View Case Study" click, then navigates. Three coordinated
  // parts (see the design notes):
  //   1. Active row text — the entrance reveal in reverse (chars fall back
  //      into the clip mask, eyebrow slides out left, button drops away).
  //   2. Active row image — wipes off toward its outer edge (clipped by the
  //      media column's overflow), revealing the brand fill behind it.
  //   3. Other rows' images — wipe off toward their edges, revealing the
  //      standard surface behind them.
  // On complete it routes through next-view-transitions, so the active row's
  // brand panel (tagged fw-brand) then morphs seamlessly into the case study
  // page's matching background while the rest cross-fades.
  const runExit = (i: number, href: string) => {
    if (isExitingRef.current) return;
    isExitingRef.current = true;

    const activeRow = bandRefs.current[i];
    const activeText = textRefs.current[i];

    // Tag the active row's brand layer as the shared transition element so its
    // color holds into the case study page (whether or not we animate below).
    const brandEl = activeRow?.querySelector<HTMLElement>(".fw-row__brand");
    if (brandEl) brandEl.style.viewTransitionName = "fw-brand";

    if (prefersReducedMotion() || !activeRow || !activeText) {
      router.push(href);
      return;
    }

    // Lock the brand fill visible — the pointer may leave the button as it
    // animates away, which would otherwise drop :hover and hide the brand.
    activeRow.classList.add("is-exiting");

    const tl = gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: () => router.push(href),
    });

    const chars = activeText.querySelectorAll(".char-inner");
    const eyebrow = activeText.querySelector(".eyebrow-inner");
    const button = activeText.querySelector(".fw-button");
    if (chars.length > 0) {
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
    if (eyebrow) tl.to(eyebrow, { opacity: 0, x: -14, duration: 0.35 }, 0);
    if (button) tl.to(button, { opacity: 0, y: 20, duration: 0.4 }, 0);

    // Wipe every row's image away with a clip mask on its media column — the
    // image stays put and is revealed away (not translated), exposing the
    // brand fill (active row) / surface (other rows) already sitting behind it
    // (.fw-row__brand, z-index 0). side "right" → image in the right column →
    // wipes off to the right (left inset grows); "left" → wipes off left.
    mediaRefs.current.forEach((inner, idx) => {
      const mediaCol = inner?.parentElement; // .fw-media
      if (!mediaCol) return;
      const exitRight = features[idx].side === "right";
      tl.fromTo(
        mediaCol,
        { clipPath: "inset(0% 0% 0% 0%)" },
        {
          clipPath: exitRight ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)",
          duration: 0.6,
          ease: "power2.inOut",
        },
        0,
      );
    });
  };

  return (
    <section ref={sectionRef} className="fw-section" id={id}>
      {features.map((f, i) => {
        // Theme-independent on purpose: light-dark() resolves at paint time
        // off the same color-scheme the anti-FOUC script sets pre-hydration,
        // so server and client always agree (see lib/use-theme.ts comment
        // for why a React-read theme value can't drive this safely).
        const themeVars = resolveThemeVars(f.theme);
        return (
          <div
            key={f.slug}
            ref={(el) => {
              bandRefs.current[i] = el;
            }}
            className={`fw-row fw-row--${f.side}${themeVars ? " fw-row--themed" : ""}`}
            style={
              themeVars
                ? ({
                    "--row-brand": themeVars["--cs-bg"],
                    "--cs-button-bg": themeVars["--cs-button-bg"],
                    "--cs-button-fg": themeVars["--cs-button-fg"],
                    "--cs-button-border": themeVars["--cs-button-border"],
                  } as CSSProperties)
                : undefined
            }
          >
            {/* Brand-color fill — its own layer (not the row's background) so
                it can carry a view-transition-name and morph into the case
                study page's matching background without dragging the image /
                text along. Transparent at rest, full brand on hover/focus. */}
            <div className="fw-row__brand" aria-hidden="true" />

            <div className="fw-clip-cell">
              <div
                ref={(el) => {
                  textRefs.current[i] = el;
                }}
                className="fw-text-fixed"
              >
                <p
                  className="type-eyebrow text-ink-muted"
                  style={{ overflow: "hidden", margin: 0 }}
                >
                  <span
                    className="eyebrow-inner"
                    style={{ display: "inline-block", willChange: "transform" }}
                  >
                    {f.eyebrow}
                  </span>
                </p>
                <h2
                  ref={(el) => {
                    headlineRefs.current[i] = el;
                  }}
                  className="type-h1 text-ink headline-constrain"
                >
                  {f.headline}
                </h2>
                {f.buttonText && (
                  <div className="fw-button">
                    <Button
                      href={`/work/${f.slug}`}
                      variant="solid"
                      size="sm"
                      aria-label={`${f.buttonText} — ${f.headline}`}
                      onClick={(e) => {
                        // Play the exit animation, then navigate (see runExit).
                        // Leave modifier / non-primary clicks alone so "open in
                        // new tab" still works.
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
                        runExit(i, `/work/${f.slug}`);
                      }}
                      onMouseEnter={() =>
                        glInstancesRef.current[i]?.setHover(true)
                      }
                      onMouseLeave={() =>
                        glInstancesRef.current[i]?.setHover(false)
                      }
                      onBlur={() => glInstancesRef.current[i]?.setHover(false)}
                      onFocus={() => {
                        // Fabric-wave hover trigger (see MediaGL.setHover) —
                        // keyboard focus gets the same treatment as a mouse
                        // hover, consistent with :focus-within elsewhere in
                        // this row (CSS brand-tint background, etc).
                        glInstancesRef.current[i]?.setHover(true);

                        // Tab can land here while the row is still off-screen
                        // (it stays in the focus order on purpose — see the
                        // .fw-text-fixed comment in layout.css). Pull the row
                        // into view so the scroll-scrubbed timeline reveals it
                        // and pointer-events line up with what's focused.
                        //
                        // Must go through Lenis, not native scrollIntoView —
                        // Lenis owns the page's scroll position and ScrollTrigger
                        // only re-syncs on Lenis's own 'scroll' event, so a
                        // native scroll call here would move window.scrollY
                        // without ever notifying ScrollTrigger, leaving the row
                        // permanently invisible despite being "in view".
                        //
                        // Scrolling the row's top/center into the viewport
                        // isn't precise enough either — the timeline's "fully
                        // revealed, no blur" window is centered on centers[i]
                        // (a fraction of the trigger's own scroll range), which
                        // doesn't line up with the row's geometric top or
                        // center. Convert that progress fraction to an actual
                        // page scroll position via the trigger's start/end.
                        const rowEl = bandRefs.current[i];
                        if (!rowEl) return;
                        const trigger = mainTriggerRef.current;
                        const p = centersRef.current[i];
                        const target =
                          trigger && p !== undefined
                            ? trigger.start + p * (trigger.end - trigger.start)
                            : rowEl;
                        if (lenis) {
                          lenis.scrollTo(target, {
                            duration: prefersReducedMotion() ? 0 : 1.2,
                          });
                        } else {
                          rowEl.scrollIntoView({
                            behavior: prefersReducedMotion()
                              ? "auto"
                              : "smooth",
                            block: "center",
                          });
                        }
                      }}
                    >
                      {f.buttonText}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="fw-media">
              <div
                ref={(el) => {
                  mediaRefs.current[i] = el;
                }}
                className="fw-media__inner"
              >
                {/* Plain <img> fallback — visible until the GL canvas
                  reports ready (onReady above), and the only thing
                  that renders at all with JS/WebGL unavailable. Both
                  light/dark variants are always rendered; layout.css picks
                  the right one via [data-theme]/prefers-color-scheme — a
                  pure CSS toggle, not React state, so there's nothing to
                  flash on first paint (see lib/use-theme.ts's resolveTheme
                  comment for why the JS-driven equivalent can).
                  eslint-disable-next-line @next/next/no-img-element */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.image}
                  alt={f.imageAlt ?? ""}
                  className="fw-img--light"
                  loading={i === 0 ? "eager" : "lazy"}
                />
                {f.imageDark && theme === "dark" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.imageDark}
                    alt={f.imageAlt ?? ""}
                    className="fw-img--dark"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                )}
                <canvas
                  ref={(el) => {
                    canvasRefs.current[i] = el;
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
