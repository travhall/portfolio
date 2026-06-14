"use client";

/**
 * HeroSection — the sticky parallax hero image.
 *
 * Structural roles:
 *   - Holds the OGL canvas (parallax shader).
 *   - `.hero-media__fallback` div for the loading state — its background-image
 *     is `var(--hero-fallback-img)`, resolved entirely by CSS (see globals.css)
 *     so the correct light/dark variant paints on the first frame with zero
 *     JS dependency. No <img>/<source> here: <source media="..."> is resolved
 *     by the browser using OS preference only, with no knowledge of
 *     data-theme — that caused a hard flash whenever the forced theme
 *     conflicted with the OS.
 *
 * The component owns the HeroGL lifecycle: instantiate on mount, dispose on
 * unmount. swapTexture() reads data-theme + prefers-color-scheme to pick the
 * correct WebGL texture, and is called on mount, OS scheme change, and manual
 * toggle.
 *
 * Pin — `.hero-section` is pinned to the top of the viewport for one
 * viewport's worth of scroll via ScrollTrigger (synced to Lenis in
 * SmoothScroll), then released so `.glass-veil`/`.work-panel` (higher
 * z-index, normal flow) slide up over it. Replaces the previous
 * `position: sticky` — same layered-scroll result, but driven through
 * ScrollTrigger so the pin's progress is available for future scroll-driven
 * effects.
 */

import { useLayoutEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HeroGL, getHeroSrc } from "@/lib/hero-gl";

const LIGHT = "/images/hero-light.jpg";
const DARK = "/images/hero-dark.jpg";

interface Props {
  intensity?: number;
}

export function HeroSection({ intensity = 1.5 }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HeroGL | null>(null);

  useLayoutEffect(() => {
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    if (!media || !canvas) return;

    // Spawns a fresh HeroGL instance with the currently-correct image src.
    // Called on mount and whenever the active theme changes.
    const swapTexture = () => {
      const src = getHeroSrc(LIGHT, DARK);

      // Dispose the old instance WITHOUT losing the WebGL context — both the
      // old and new HeroGL share the same canvas (and therefore the same GL
      // context). Calling loseContext() here would destroy the new instance too.
      glRef.current?.dispose(true);
      glRef.current = null;

      glRef.current = new HeroGL(canvas, {
        src,
        effect: "parallax",
        intensity,
        onReady: () => media.classList.add("is-gl"),
      });
    };

    swapTexture();

    // Watch OS-level color scheme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", swapTexture);

    // Watch manual data-theme attribute set by the in-menu theme toggle
    const observer = new MutationObserver(swapTexture);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => {
      mq.removeEventListener("change", swapTexture);
      observer.disconnect();
      // keepContext: forcing context loss here breaks React StrictMode's
      // double-invoke (mount -> cleanup -> mount) — the second mount reuses
      // this canvas, but a lost WebGL context returns null from
      // getExtension(), which crashes ogl's Geometry on bindVertexArray.
      // The detached canvas is GC'd shortly after anyway.
      glRef.current?.dispose(true);
      glRef.current = null;
      media.classList.remove("is-gl");
    };
  }, [intensity]);

  // Pin the hero in place (no spacer) once it reaches the top of the
  // viewport, so .glass-veil and .work-panel — higher z-index, normal flow —
  // scroll up and over it for the rest of the page.
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const pin = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      endTrigger: ".work-panel",
      end: "bottom bottom",
      pin: true,
      pinSpacing: false,
    });

    return () => pin.kill();
  }, []);

  return (
    <section ref={sectionRef} className="hero-section">
      <div ref={mediaRef} className="hero-media">
        {/* CSS fallback — background-image driven by --hero-fallback-img,
            resolved by CSS before first paint. See globals.css.            */}
        <div className="hero-media__fallback" aria-hidden="true" />
        {/* OGL canvas — fades in via .is-gl on hero-media */}
        <canvas ref={canvasRef} className="hero-media__gl" aria-hidden="true" />
      </div>
    </section>
  );
}
