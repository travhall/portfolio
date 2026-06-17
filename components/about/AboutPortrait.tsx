"use client";

/**
 * AboutPortrait — the about page's anchor portrait, sharing the
 * chromatic-aberration parallax shader (see lib/media-gl.ts). A single
 * image, no light/dark variants — unlike HeroSection there's no texture
 * swap on theme change.
 */

import { useLayoutEffect, useRef } from "react";
import { MediaGL } from "@/lib/media-gl";

const SRC = "/images/about-img.jpg";

export function AboutPortrait() {
  const mediaRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef     = useRef<MediaGL | null>(null);

  useLayoutEffect(() => {
    const media  = mediaRef.current;
    const canvas = canvasRef.current;
    if (!media || !canvas) return;

    glRef.current = new MediaGL(canvas, {
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
