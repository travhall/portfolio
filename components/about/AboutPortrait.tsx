"use client";

/**
 * AboutPortrait — the about page's anchor portrait, sharing the hero's
 * chromatic-aberration parallax shader (see lib/hero-gl.ts). A single
 * image, no light/dark variants — unlike HeroSection there's no texture
 * swap on theme change.
 */

import { useLayoutEffect, useRef } from "react";
import { HeroGL } from "@/lib/hero-gl";

const SRC = "/images/about-img.jpg";

export function AboutPortrait() {
  const mediaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HeroGL | null>(null);

  useLayoutEffect(() => {
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    if (!media || !canvas) return;

    glRef.current = new HeroGL(canvas, {
      src: SRC,
      effect: "parallax",
      intensity: 1.5,
      onReady: () => media.classList.add("is-gl"),
    });

    return () => {
      glRef.current?.dispose(true);
      glRef.current = null;
      media.classList.remove("is-gl");
    };
  }, []);

  return (
    <div ref={mediaRef} className="about-portrait" role="img" aria-label="Travis Hall">
      <div className="about-portrait__fallback" aria-hidden="true" />
      <canvas ref={canvasRef} className="about-portrait__gl" aria-hidden="true" />
    </div>
  );
}
