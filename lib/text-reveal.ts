// text-reveal — the FeatureWipe headline reveal, packaged for reuse by the
// site's entrance animations (hero statement, wordmark). SplitText an element
// into lines + chars and cascade the chars up out of a per-line clip mask
// (.line-mask / .char-inner — styled globally in components.css).
//
// Returns a PAUSED timeline plus a cleanup that reverts the split back to
// plain text. Callers gate on prefersReducedMotion() themselves and simply
// skip calling this when motion is off, leaving the text in its natural state.

import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

export interface TextReveal {
  split: SplitText;
  tl: gsap.core.Timeline;
  ready: Promise<void>; // resolves when the split is final (font-safe)
  cleanup: () => void;
}

export function createTextReveal(
  el: HTMLElement,
  opts: { delay?: number; duration?: number; stagger?: number } = {},
): TextReveal {
  const { delay = 0, duration = 0.7, stagger = 0.4 } = opts;

  let split = new SplitText(el, {
    type: "lines,chars",
    linesClass: "line-mask",
    charsClass: "char-inner",
  });
  gsap.set(split.chars as unknown as Element[], { yPercent: 105 });
  // The caller's target element defaults to `opacity: 0` in CSS (see the
  // matching rule for its selector in app/layout.css) so the very first
  // paint — before any JS runs — never shows unhidden text. Once this
  // function has synchronously hidden the individual characters above, it's
  // safe to reveal the container: nothing inside it is visible yet. This
  // runs once here, not inside the fonts.ready re-split below, since
  // container-level opacity never needs to change again after this point.
  gsap.set(el, { opacity: 1 });

  const tl = gsap.timeline({
    paused: true,
    delay,
    // Once the cascade has landed, drop the compositor-layer hint these chars
    // inherit from .char-inner's global `will-change: transform`. They're a
    // one-time entrance reveal, not a repeatedly-animated element, so holding
    // the hint for the life of the page just wastes GPU memory. Inline style
    // overrides the class rule. (FeatureWipe's scroll-scrubbed .char-inner
    // headlines keep the global hint — this only touches this helper's chars.)
    // Read `split.chars` at call time (not a closed-over `chars` const) since
    // the font-ready re-split below reassigns `split`.
    onComplete: () => {
      gsap.set(split.chars as unknown as Element[], { willChange: "auto" });
    },
  });

  // Build (or rebuild) the char cascade against the current split.
  const buildTween = () => {
    tl.clear();
    tl.to(split.chars as unknown as Element[], {
      yPercent: 0,
      ease: "power3.out",
      duration,
      stagger: { amount: stagger },
    });
  };
  buildTween();

  let cancelled = false;

  // If the font isn't loaded yet, the synchronous split above measured line
  // breaks against the fallback font. Re-split once fonts are ready so the
  // masks match the final glyph metrics, then re-hide and rebuild the tween.
  const fonts = typeof document !== "undefined" ? document.fonts : undefined;
  const ready: Promise<void> =
    fonts && fonts.status !== "loaded"
      ? fonts.ready.then(() => {
          if (cancelled) return;
          split.revert();
          split = new SplitText(el, {
            type: "lines,chars",
            linesClass: "line-mask",
            charsClass: "char-inner",
          });
          gsap.set(split.chars as unknown as Element[], { yPercent: 105 });
          buildTween();
        })
      : Promise.resolve();

  return {
    split,
    tl,
    ready,
    cleanup: () => {
      cancelled = true;
      tl.kill();
      split.revert();
    },
  };
}
