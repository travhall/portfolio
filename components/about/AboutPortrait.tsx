"use client";

/**
 * AboutPortrait — the about page's anchor portrait, sharing the
 * chromatic-aberration parallax shader (see lib/media-gl.ts). Swaps between
 * light/dark source images on theme change, same pattern as FeatureWipe.
 * The parallax/chromatic-aberration GL effect itself is skipped under
 * reduced motion — the plain <img> fallback (.about-portrait__fallback)
 * stands in, same as FeatureWipe's images.
 */

import { useLayoutEffect, useRef } from "react";
import { MediaGL } from "@/lib/media-gl";
import { useTheme } from "@/lib/use-theme";
import { useMotionPref } from "@/lib/motion-pref";

const SRC_LIGHT = "/images/about-img-light.jpg";
const SRC_DARK = "/images/about-img-dark.jpg";

export function AboutPortrait() {
  const theme = useTheme();
  const motionPref = useMotionPref();
  const mediaRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef     = useRef<MediaGL | null>(null);

  useLayoutEffect(() => {
    const media  = mediaRef.current;
    const canvas = canvasRef.current;
    if (!media || !canvas || motionPref === "off") return;

    glRef.current = new MediaGL(canvas, {
      src: theme === "dark" ? SRC_DARK : SRC_LIGHT,
      effect: "parallax",
      intensity: 1.5,
      onReady: () => media.classList.add("is-gl"),
    });

    return () => {
      glRef.current?.dispose(true);
      glRef.current = null;
      media.classList.remove("is-gl");
    };
  }, [theme, motionPref]);

  return (
    <div ref={mediaRef} className="about-portrait" role="img" aria-label="Travis Hall">
      <div className="about-portrait__fallback" aria-hidden="true" />
      <canvas ref={canvasRef} className="about-portrait__gl" aria-hidden="true" />
    </div>
  );
}
