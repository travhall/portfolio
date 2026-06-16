"use client";

/**
 * FeatureWipe — USP section scroll mechanic with clip-path wipe effects.
 * Faithful re-engineering of the godaylight.com feature section.
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
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import styles from "./FeatureWipe.module.css";

gsap.registerPlugin(ScrollTrigger, SplitText);

export interface Feature {
  eyebrow: string;
  headline: string;
  side: "left" | "right";
  imageSrc?: string;
  imageAlt?: string;
}

interface Props {
  features: Feature[];
}

export function FeatureWipe({ features }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headlineRefs = useRef<(HTMLHeadingElement | null)[]>([]);

  // Keep arrays matching current features length
  bandRefs.current = bandRefs.current.slice(0, features.length);
  textRefs.current = textRefs.current.slice(0, features.length);
  imgRefs.current = imgRefs.current.slice(0, features.length);
  headlineRefs.current = headlineRefs.current.slice(0, features.length);

  useLayoutEffect(() => {
    let ctx: gsap.Context;
    let splits: SplitText[] = [];
    let childSplits: SplitText[] = [];
    let currentWidth = window.innerWidth;

    function init() {
      // 1. Clean up previous context & splits
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
      childSplits.forEach((s) => s.revert());
      splits = [];
      childSplits = [];

      // 2. Mobile / reduced-motion check
      const isDesktop = window.innerWidth >= 900;
      if (!isDesktop) return;

      // 3. Create context for easy scoped cleanup
      ctx = gsap.context(() => {
        // Create SplitText on headlines
        headlineRefs.current.forEach((headlineEl) => {
          if (!headlineEl) return;
          const childSplit = new SplitText(headlineEl, { type: "lines" });
          const parentSplit = new SplitText(headlineEl, {
            type: "lines",
            linesClass: "fw-line-mask",
          });
          splits.push(parentSplit);
          childSplits.push(childSplit);
        });

        // Set initial positions
        gsap.set(textRefs.current, { autoAlpha: 0, y: 80 });
        headlineRefs.current.forEach((_, idx) => {
          const childLines = childSplits[idx]?.lines || [];
          if (childLines.length > 0) {
            gsap.set(childLines, { yPercent: 100 });
          }
          const eyebrowInner = textRefs.current[idx]?.querySelector(".fw-eyebrow-inner");
          if (eyebrowInner) {
            gsap.set(eyebrowInner, { yPercent: 100 });
          }
        });

        // Scrubbed GSAP Timeline for the full feature block
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

        // Calculate scroll trigger distance
        // start is when top of section is at 52% vh
        // end is when bottom of section is at 50% vh
        const totalScrollDistance = sectionH + vh * 0.02;

        const N = features.length;

        // Calculate the normalized scroll progress point where each row is centered in the viewport
        const centers = bandRefs.current.map((rowEl) => {
          if (!rowEl) return 0;
          const rowCenter = rowEl.offsetTop + rowEl.offsetHeight / 2;
          return (rowCenter + vh * 0.02) / totalScrollDistance;
        });

        for (let i = 0; i < N; i++) {
          const textEl = textRefs.current[i];
          if (!textEl) continue;

          const p_i = centers[i];

          // Calculate distance to adjacent centers to space transitions beautifully
          let dist = 0.2; // default fallback
          if (N > 1) {
            if (i < N - 1) {
              dist = centers[i + 1] - centers[i];
            } else {
              dist = centers[i] - centers[i - 1];
            }
          }

          // Timing windows centered around p_i
          let fadeInStart = p_i - dist * 0.4;
          let fadeInEnd = p_i - dist * 0.1;

          // For the very first item, start fading in immediately as we enter the section
          if (i === 0) {
            fadeInStart = 0.02;
            fadeInEnd = p_i - dist * 0.1;
          }

          const fadeInDuration = fadeInEnd - fadeInStart;

          // Y-drift range (drift starts halfway from previous and ends halfway to next)
          const driftStart = i === 0 ? 0.0 : p_i - dist * 0.5;
          const driftEnd = i === N - 1 ? 1.0 : p_i + dist * 0.5;

          // Constant speed Y-drift throughout this item's active window
          tl.fromTo(
            textEl,
            { y: 80 },
            { y: -80, ease: "none", duration: driftEnd - driftStart },
            driftStart
          );

          // Fade In
          tl.to(
            textEl,
            { autoAlpha: 1, ease: "power1.out", duration: fadeInDuration },
            fadeInStart
          );

          // Eyebrow reveal
          const eyebrowInner = textEl.querySelector(".fw-eyebrow-inner");
          if (eyebrowInner) {
            tl.to(
              eyebrowInner,
              { yPercent: 0, ease: "power2.out", duration: fadeInDuration * 0.8 },
              fadeInStart
            );
          }

          // Headline lines stagger reveal
          const childLines = childSplits[i]?.lines || [];
          if (childLines.length > 0) {
            tl.to(
              childLines,
              {
                yPercent: 0,
                ease: "power2.out",
                duration: fadeInDuration * 0.8,
                stagger: (fadeInDuration * 0.2) / childLines.length,
              },
              fadeInStart
            );
          }

          // Fade Out (for all except the last item)
          if (i < N - 1) {
            const fadeOutStart = p_i + dist * 0.1;
            const fadeOutEnd = p_i + dist * 0.4;
            const fadeOutDuration = fadeOutEnd - fadeOutStart;

            tl.to(
              textEl,
              { autoAlpha: 0, ease: "power1.in", duration: fadeOutDuration },
              fadeOutStart
            );
          }
        }

        // Clip-reveal & scale-down animations on image columns
        bandRefs.current.forEach((rowEl, idx) => {
          if (!rowEl) return;
          const imgInner = imgRefs.current[idx];
          if (!imgInner) return;

          gsap.fromTo(
            imgInner,
            {
              clipPath: "inset(20% 0% 20% 0%)",
              scale: 1.4,
            },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              scale: 1.0,
              ease: "power1.out",
              scrollTrigger: {
                trigger: rowEl,
                start: "top 95%",
                end: "top 40%",
                scrub: true,
              },
            }
          );
        });
      }, sectionRef);
    }

    init();

    // Debounced window resize handler to rebuild splits & layout
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      if (window.innerWidth === currentWidth) return;
      currentWidth = window.innerWidth;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        init();
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      if (ctx) ctx.revert();
      splits.forEach((s) => s.revert());
      childSplits.forEach((s) => s.revert());
    };
  }, [features]);

  return (
    <section ref={sectionRef} className={styles.features}>
      {features.map((f, i) => (
        <div
          key={i}
          ref={(el) => {
            bandRefs.current[i] = el;
          }}
          className={`${styles.row} ${f.side === "left" ? styles.rowLeft : styles.rowRight}`}
        >
          <div className={styles.clipCell}>
            <div
              ref={(el) => {
                textRefs.current[i] = el;
              }}
              className={styles.textFixed}
            >
              <p className={styles.eyebrow}>
                <span
                  className="fw-eyebrow-inner"
                  style={{ display: "inline-block", willChange: "transform" }}
                >
                  {f.eyebrow}
                </span>
              </p>
              <h2
                ref={(el) => {
                  headlineRefs.current[i] = el;
                }}
                className={styles.headline}
              >
                {f.headline}
              </h2>
            </div>
          </div>

          <div className={styles.media}>
            <div
              ref={(el) => {
                imgRefs.current[i] = el;
              }}
              className={styles.mediaInner}
            >
              {f.imageSrc ? (
                <img src={f.imageSrc} alt={f.imageAlt ?? ""} />
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
