'use client';

/**
 * HeroSection — the sticky parallax hero image.
 *
 * Structural roles:
 *   - Holds the OGL canvas (parallax shader).
 *   - `<img>` fallback inside for the loading state (no <source> — see below).
 *   - `view-transition-name: hero-image` on the media wrapper so the browser
 *     morphs it into the about portrait on route change.
 *
 * The component owns the HeroGL lifecycle: instantiate on mount, dispose on
 * unmount. swapTexture() reads data-theme + prefers-color-scheme to pick the
 * correct image, and is called on mount, OS scheme change, and manual toggle.
 *
 * Why no <source media="(prefers-color-scheme: dark)">:
 *   The browser evaluates <source media="..."> using OS preference only —
 *   it has no concept of data-theme. When the forced theme conflicts with
 *   the OS, the browser would load the wrong image before any JS runs,
 *   causing a hard flash. Removing <source> lets swapTexture() always
 *   be the single source of truth for which image is displayed.
 */

import { useEffect, useRef } from 'react';
import { HeroGL, getHeroSrc } from '@/lib/hero-gl';

const LIGHT = '/images/hero-light.jpg';
const DARK  = '/images/hero-dark.jpg';

interface Props {
  intensity?: number;
}

export function HeroSection({ intensity = 1.5 }: Props) {
  const mediaRef     = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const fallbackRef  = useRef<HTMLImageElement>(null);
  const glRef        = useRef<HeroGL | null>(null);

  useEffect(() => {
    const media  = mediaRef.current;
    const canvas = canvasRef.current;
    if (!media || !canvas) return;

    // Spawns a fresh HeroGL instance with the currently-correct image src.
    // Called on mount and whenever the active theme changes.
    const swapTexture = () => {
      const src = getHeroSrc(LIGHT, DARK);

      // Update the <img> fallback so it matches if GL hasn't loaded yet
      if (fallbackRef.current) fallbackRef.current.src = src;

      // Dispose the old instance WITHOUT losing the WebGL context — both the
      // old and new HeroGL share the same canvas (and therefore the same GL
      // context). Calling loseContext() here would destroy the new instance too.
      glRef.current?.dispose(true);
      glRef.current = null;

      glRef.current = new HeroGL(canvas, {
        src,
        effect:    'parallax',
        intensity,
        onReady: () => media.classList.add('is-gl'),
      });
    };

    swapTexture();

    // Watch OS-level color scheme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', swapTexture);

    // Watch manual data-theme attribute set by the in-menu theme toggle
    const observer = new MutationObserver(swapTexture);
    observer.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['data-theme'],
    });

    return () => {
      mq.removeEventListener('change', swapTexture);
      observer.disconnect();
      // keepContext: forcing context loss here breaks React StrictMode's
      // double-invoke (mount -> cleanup -> mount) — the second mount reuses
      // this canvas, but a lost WebGL context returns null from
      // getExtension(), which crashes ogl's Geometry on bindVertexArray.
      // The detached canvas is GC'd shortly after anyway.
      glRef.current?.dispose(true);
      glRef.current = null;
      media.classList.remove('is-gl');
    };
  }, [intensity]);

  return (
    <section className="hero-section">
      <div ref={mediaRef} className="hero-media">
        {/* CSS/SSR fallback — shown until the shader is ready.
            No <source media="..."> here: the browser evaluates <source>
            using OS-level media queries which have no knowledge of
            data-theme. That caused a hard flash of the wrong image when
            the forced theme competed with the OS preference. swapTexture()
            sets the correct src on mount before the canvas is ready.      */}
        <picture className="hero-media__fallback">
          <img
            ref={fallbackRef}
            src={LIGHT}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        </picture>
        {/* OGL canvas — fades in via .is-gl on hero-media */}
        <canvas ref={canvasRef} className="hero-media__gl" aria-hidden="true" />
      </div>
    </section>
  );
}
