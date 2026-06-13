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
 * Float-in entrance — once per session, `.hero-media` fades and slides up
 * into place from below its frame (GSAP), while the GL layer plays a synced
 * radial ripple that decays to nothing as it settles — the print rising
 * through the fixer bath. The pre-entrance (hidden) state is set in CSS via
 * the `data-hero-pending` attribute (see app/layout.tsx's inline script +
 * html[data-hero-pending] in layout.css), so SSR paints it directly with no
 * flash of the settled frame before this effect runs. This layout effect
 * then either plays the entrance (first visit) or instantly clears that
 * state (repeat visit / reduced motion).
 */

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { HeroGL, getHeroSrc } from "@/lib/hero-gl";
import { prefersReducedMotion } from "@/components/ui/ripple";

const ENTRANCE_KEY = "hero-entrance-done";

const LIGHT = "/images/hero-light.jpg";
const DARK = "/images/hero-dark.jpg";

interface Props {
  intensity?: number;
}

export function HeroSection({ intensity = 1.5 }: Props) {
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

    // Float-in entrance — once per session, settling from below with a
    // synced GL ripple. Skipped (and marked done) under reduced motion or on
    // repeat visits within the session — both cases instantly clear the
    // CSS pre-entrance state set by the layout.tsx anti-FOUC script.
    let entranceTween: gsap.core.Tween | null = null;
    if (prefersReducedMotion() || sessionStorage.getItem(ENTRANCE_KEY)) {
      sessionStorage.setItem(ENTRANCE_KEY, "1");
      document.documentElement.removeAttribute("data-hero-pending");
    } else {
      gsap.set(media, { yPercent: 100, opacity: 0 });
      entranceTween = gsap.to(media, {
        yPercent: 0,
        opacity: 1,
        duration: 1.6,
        ease: "power3.out",
        clearProps: "transform,opacity",
        onUpdate() {
          glRef.current?.setEntrance(1 - this.progress());
        },
        onComplete: () => {
          sessionStorage.setItem(ENTRANCE_KEY, "1");
          document.documentElement.removeAttribute("data-hero-pending");
        },
      });
    }

    return () => {
      mq.removeEventListener("change", swapTexture);
      observer.disconnect();
      entranceTween?.kill();
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

  return (
    <section className="hero-section">
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
