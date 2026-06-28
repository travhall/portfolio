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
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/Button";
import { MediaGL } from "@/lib/media-gl";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { useLenis } from "@/components/providers/SmoothScroll";
import { useTheme, resolveTheme } from "@/lib/use-theme";
import { useMotionPref } from "@/lib/motion-pref";
import { DESKTOP_BP } from "@/lib/breakpoints";
import type { CaseStudy } from "@/lib/case-studies";
import {
  MagneticDots,
  supportsHoverPointer,
  type RGB,
} from "@/lib/magnetic-dots";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Chromatic aberration intensity — higher than 1.5 default to compensate
// for the smaller canvas size relative to the hero. At 1.8 the channel
// separation is clearly visible on fast scrolls without being distracting
// at rest.
const IMG_INTENSITY = 1.8;

function imageFor(f: CaseStudy, theme: "light" | "dark") {
  return theme === "dark" && f.imageDark ? f.imageDark : f.image;
}

function brandColorFor(f: CaseStudy, theme: "light" | "dark") {
  if (theme === "dark") return f.brandDark ?? f.brandLight;
  return f.brandLight;
}

// Resolves any CSS color (oklch(), var(--token), etc.) to 0–1 RGB by letting
// the browser's own color parser do the work via a throwaway 2D canvas —
// far simpler than hand-rolling OKLCH→sRGB, and WebGL only accepts plain
// RGB floats, not CSS color strings.
let colorProbeCtx: CanvasRenderingContext2D | null = null;
function cssColorToRgb(color: string): RGB {
  if (!colorProbeCtx) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    colorProbeCtx = c.getContext("2d", { willReadFrequently: true });
  }
  const ctx = colorProbeCtx;
  if (!ctx) return [0, 0, 0];
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255];
}

interface Props {
  features: CaseStudy[];
  id?: string;
}

export function FeatureWipe({ features, id }: Props) {
  const lenis = useLenis();
  const theme = useTheme();
  const motionPref = useMotionPref();
  const sectionRef = useRef<HTMLElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]); // .mediaInner wrappers
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]); // GL canvases
  const dotsCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]); // magnetic-dots overlay canvases
  const headlineRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const glInstancesRef = useRef<(MediaGL | null)[]>([]); // one per feature
  const dotsInstancesRef = useRef<(MagneticDots | null)[]>([]); // one per feature

  // Scroll-progress target for each row's "fully revealed" window (centers[i]
  // below) plus the main timeline's ScrollTrigger, so the onFocus handler can
  // scroll to the exact page position the timeline considers "active" for
  // that row — not just "row roughly in viewport", which can land mid-fade.
  const centersRef = useRef<number[]>([]);
  const mainTriggerRef = useRef<ScrollTrigger | null>(null);

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
    const reduced = motionPref === "off";

    function init() {
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
      splits = [];
      perFeatureChars = [];

      if (reduced) {
        // No scroll-driven cascade — CSS (layout.css, the reduced-motion +
        // data-motion="off" blocks) collapses every row to the same static
        // stacked layout used on mobile, regardless of width.
        centersRef.current = [];
        mainTriggerRef.current = null;
        return;
      }

      const isDesktop = window.innerWidth >= DESKTOP_BP;
      if (!isDesktop) {
        // Mobile layout forces .fw-text-fixed visible via CSS (no scrubbed
        // timeline at all), so there's no scroll-progress target to reuse.
        centersRef.current = [];
        mainTriggerRef.current = null;
        return;
      }

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
            tl.to(
              textEl,
              {
                opacity: 0,
                filter: "blur(8px)",
                ease: "power1.in",
                duration: fadeOutDuration,
              },
              fadeOutStart,
            );
          }
        }

        // Clip reveal on image wrappers — no scale, shader handles depth.
        // inset clips top and bottom symmetrically so the reveal reads as
        // the image rising into frame rather than scaling up from centre.
        bandRefs.current.forEach((rowEl, idx) => {
          if (!rowEl) return;
          const mediaInner = mediaRefs.current[idx];
          if (!mediaInner) return;

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

    init();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if (window.innerWidth === currentWidth) return;
      currentWidth = window.innerWidth;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(init, 200);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
    };
  }, [features, motionPref]);

  // ── Lazy media effect ───────────────────────────────────────────────────
  // GL (chromatic-aberration parallax) + magnetic-dots halftone canvases.
  // Depends on `theme` (image src + ink color) but not on layout/SplitText,
  // so toggling theme only re-runs this — no GSAP timeline/SplitText churn.
  // Lazy per-row via IntersectionObserver: each row owns up to two WebGL2
  // contexts, and browsers cap concurrent contexts (mobile Safari ~8), so
  // only rows near the viewport get a live context at any time.
  useLayoutEffect(() => {
    mediaRefs.current = mediaRefs.current.slice(0, features.length);
    canvasRefs.current = canvasRefs.current.slice(0, features.length);
    dotsCanvasRefs.current = dotsCanvasRefs.current.slice(0, features.length);
    glInstancesRef.current = glInstancesRef.current.slice(0, features.length);
    dotsInstancesRef.current = dotsInstancesRef.current.slice(
      0,
      features.length,
    );

    const glTriggers: (ReturnType<typeof ScrollTrigger.create> | null)[] =
      features.map(() => null);
    const dotsCleanups: ((() => void) | null)[] = features.map(() => null);
    let mediaObserver: IntersectionObserver | null = null;
    const reduced = motionPref === "off";

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
          // Same scroll-velocity signal also drives the dots canvas's
          // chromatic-aberration fringe — only visible while it's also
          // hovered (CSS opacity), so this is harmless the rest of the time.
          dotsInstancesRef.current[i]?.setScrollState(vel);
        },
      });
    }

    // Pointer-driven hover effect — skipped entirely on touch/coarse-pointer
    // devices (see supportsHoverPointer), so it never attaches listeners or
    // spins up a canvas where there's no mouse to react to. Also lazy per
    // row, for the same WebGL-context-budget reason as GL above.

    // Paper color is the same for every row (the page surface); read once
    // per init rather than per-row.
    let paperColor: RGB = [1, 1, 1];
    let inkFallback = "";

    function disposeRowDots(i: number) {
      dotsCleanups[i]?.();
      dotsCleanups[i] = null;
      dotsInstancesRef.current[i]?.dispose();
      dotsInstancesRef.current[i] = null;
    }

    function initRowDots(i: number) {
      if (dotsInstancesRef.current[i] || !supportsHoverPointer()) return;
      const f = features[i];
      const canvas = dotsCanvasRefs.current[i];
      const rowEl = bandRefs.current[i];
      // resolveTheme(), not the theme closure value — same reasoning as
      // initRowGL above.
      const rowTheme = resolveTheme();
      const src = imageFor(f, rowTheme);
      if (!canvas || !rowEl || !src) return;

      const inkColor = cssColorToRgb(brandColorFor(f, rowTheme) ?? inkFallback);
      const dots = new MagneticDots(canvas, { src, inkColor, paperColor });
      dotsInstancesRef.current[i] = dots;

      // Tracked across the whole row (not just the photo) — the dots
      // canvas is a full-row backdrop sitting behind both the photo and
      // text columns, so hovering anywhere on the row should drive it.
      const onMove = (e: PointerEvent) => {
        const r = rowEl.getBoundingClientRect();
        dots.setPointer(
          (e.clientX - r.left) / r.width,
          (e.clientY - r.top) / r.height,
        );
      };
      const onEnter = (e: PointerEvent) => {
        onMove(e);
        dots.enter();
      };
      const onLeave = () => dots.leave();

      rowEl.addEventListener("pointerenter", onEnter);
      rowEl.addEventListener("pointermove", onMove);
      rowEl.addEventListener("pointerleave", onLeave);
      dotsCleanups[i] = () => {
        rowEl.removeEventListener("pointerenter", onEnter);
        rowEl.removeEventListener("pointermove", onMove);
        rowEl.removeEventListener("pointerleave", onLeave);
      };
    }

    function disposeAllMedia() {
      features.forEach((_, i) => {
        disposeRowGL(i);
        disposeRowDots(i);
      });
    }

    // Lazily inits/disposes GL + dots per row as it nears the viewport,
    // instead of creating up to 2×N WebGL contexts up front.
    function setupLazyMedia() {
      mediaObserver?.disconnect();
      // Computed fresh each call (including on theme change) so ink/paper
      // colors track light/dark automatically.
      const rootStyle = getComputedStyle(document.documentElement);
      paperColor = cssColorToRgb(rootStyle.getPropertyValue("--surface"));
      inkFallback = rootStyle.getPropertyValue("--ink");

      mediaObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const i = bandRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (i === -1) return;
            if (entry.isIntersecting) {
              initRowGL(i);
              initRowDots(i);
            } else {
              disposeRowGL(i);
              disposeRowDots(i);
            }
          });
        },
        { rootMargin: "50% 0px" }, // preload/keep alive one viewport-height early
      );
      bandRefs.current.forEach((el) => el && mediaObserver?.observe(el));
    }

    if (reduced) {
      // No parallax/halftone canvases — CSS collapses every row to the
      // static stacked layout regardless of width.
      disposeAllMedia();
    } else {
      // Always init regardless of breakpoint — images show on mobile too.
      setupLazyMedia();
    }

    return () => {
      mediaObserver?.disconnect();
      disposeAllMedia();
    };
  }, [features, theme, motionPref]);

  return (
    <section ref={sectionRef} className="fw-section" id={id}>
      {features.map((f, i) => {
        // Theme-independent on purpose: light-dark() resolves at paint time
        // off the same color-scheme the anti-FOUC script sets pre-hydration,
        // so server and client always agree (see lib/use-theme.ts comment
        // for why a React-read theme value can't drive this safely).
        const rowBrand = f.brandLight
          ? `light-dark(${f.brandLight}, ${f.brandDark ?? f.brandLight})`
          : undefined;
        return (
          <div
            key={f.slug}
            ref={(el) => {
              bandRefs.current[i] = el;
            }}
            className={`fw-row fw-row--${f.side}`}
            style={
              rowBrand
                ? ({ "--row-brand": rowBrand } as CSSProperties)
                : undefined
            }
          >
            {/* Magnetic-dots hover backdrop — fills the whole row, behind the
              photo and text columns. Hidden (alpha 0) until the cursor
              enters; see lib/magnetic-dots.ts. Not rendered at all on
              touch/coarse-pointer devices (initDots no-ops). */}
            <canvas
              ref={(el) => {
                dotsCanvasRefs.current[i] = el;
              }}
              className="fw-dots-canvas"
              aria-hidden="true"
            />

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
                      onFocus={() => {
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
                />
                {f.imageDark && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.imageDark}
                    alt={f.imageAlt ?? ""}
                    className="fw-img--dark"
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
