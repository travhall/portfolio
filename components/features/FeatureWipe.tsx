"use client";

/**
 * FeatureWipe — USP section scroll mechanic with clip-path wipe effects.
 * Faithful re-engineering of the godaylight.com feature section. cSpell:ignore godaylight
 *
 * Key mechanic:
 *   - The <section> has large top + bottom padding acting as scroll dwell buffers.
 *   - Rows are stacked naturally with grid layout (NOT 100vh).
 *   - Text divs inside each row are position:fixed, centered on the viewport.
 *   - A clip-path mask on the scrolling parent (.clipCell) paint-clips the fixed
 *     text to its own bounding box, creating a beautiful wipe reveal as the row
 *     scrolls past.
 *   - A single GSAP ScrollTrigger timeline coordinates the autoAlpha, Y drift,
 *     and line-by-line SplitText reveals across all items.
 *   - Each image column is an OGL canvas running the same chromatic-aberration
 *     parallax shader as the hero, driven per-row by its own ScrollTrigger.
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Button } from "@/components/ui/Button";
import { MediaGL } from "@/lib/media-gl";

gsap.registerPlugin(ScrollTrigger, SplitText);

// Chromatic aberration intensity — higher than 1.5 default to compensate
// for the smaller canvas size relative to the hero. At 1.8 the channel
// separation is clearly visible on fast scrolls without being distracting
// at rest.
const IMG_INTENSITY = 1.8;

export interface Feature {
  eyebrow: string;
  headline: string;
  side: "left" | "right";
  imageSrc?: string;
  imageAlt?: string;
  buttonText?: string;
  buttonUrl?: string;
}

interface Props {
  features: Feature[];
  id?: string;
}

export function FeatureWipe({ features, id }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]); // .mediaInner wrappers
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]); // GL canvases
  const headlineRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const glInstancesRef = useRef<(MediaGL | null)[]>([]); // one per feature

  // Keep arrays matching current features length
  bandRefs.current = bandRefs.current.slice(0, features.length);
  textRefs.current = textRefs.current.slice(0, features.length);
  mediaRefs.current = mediaRefs.current.slice(0, features.length);
  canvasRefs.current = canvasRefs.current.slice(0, features.length);
  headlineRefs.current = headlineRefs.current.slice(0, features.length);
  glInstancesRef.current = glInstancesRef.current.slice(0, features.length);

  useLayoutEffect(() => {
    let ctx: gsap.Context;
    let splits: SplitText[] = [];
    let perFeatureChars: Element[][] = [];
    let glTriggers: ReturnType<typeof ScrollTrigger.create>[] = [];
    let currentWidth = window.innerWidth;

    // ── GL lifecycle ────────────────────────────────────────────────────────
    // Dispose all existing GL instances (called before re-init and on unmount)
    function disposeGL() {
      glInstancesRef.current.forEach((gl) => gl?.dispose());
      glInstancesRef.current = features.map(() => null);
      mediaRefs.current.forEach((el) => el?.classList.remove("is-gl"));
    }

    // Instantiate one HeroGL per canvas, driven by a per-row ScrollTrigger.
    // u_vel  ← instantaneous scroll speed, eased by HeroGL's internal spring
    // u_scroll ← 0→1 as the row travels through the viewport
    function initGL() {
      // Kill stale GL triggers before creating new ones — they're created
      // outside gsap.context() so ctx.revert() won't reach them.
      glTriggers.forEach((t) => t?.kill());
      glTriggers = [];
      disposeGL();

      features.forEach((f, i) => {
        const canvas = canvasRefs.current[i];
        const rowEl = bandRefs.current[i];
        if (!canvas || !f.imageSrc || !rowEl) return;

        const gl = new MediaGL(canvas, {
          src: f.imageSrc,
          effect: "parallax",
          intensity: IMG_INTENSITY,
          externalScroll: true, // disable internal _measure(), ScrollTrigger drives it
          onReady: () => mediaRefs.current[i]?.classList.add("is-gl"),
        });
        glInstancesRef.current[i] = gl;

        let lastY = window.scrollY;

        const trigger = ScrollTrigger.create({
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
        glTriggers.push(trigger);
      });
    }

    // ── Main init ───────────────────────────────────────────────────────────
    function init() {
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
      splits = [];
      perFeatureChars = [];

      const isDesktop = window.innerWidth >= 900;

      // Always init GL regardless of breakpoint — images show on mobile too
      initGL();

      if (!isDesktop) return;

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
        gsap.set(textRefs.current, { autoAlpha: 0, y: 80 });
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
          tl.set(textEl, { autoAlpha: 1 }, fadeInStart);

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
            tl.to(
              textEl,
              {
                autoAlpha: 0,
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
      glTriggers.forEach((t) => t?.kill());
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
      disposeGL();
    };
  }, [features]);

  return (
    <section ref={sectionRef} className="fw-section" id={id}>
      {features.map((f, i) => (
        <div
          key={i}
          ref={(el) => {
            bandRefs.current[i] = el;
          }}
          className={`fw-row fw-row--${f.side}`}
        >
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
              {f.buttonText && f.buttonUrl && (
                <div className="fw-button" style={{ pointerEvents: "auto" }}>
                  <Button href={f.buttonUrl} variant="solid" size="sm">
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
              {f.imageSrc ? (
                <>
                  {/* Plain <img> fallback — visible until the GL canvas
                      reports ready (onReady above), and the only thing
                      that renders at all with JS/WebGL unavailable. */}
                  <img src={f.imageSrc} alt={f.imageAlt ?? ""} />
                  <canvas
                    ref={(el) => {
                      canvasRefs.current[i] = el;
                    }}
                    aria-hidden="true"
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
