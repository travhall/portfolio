"use client";

/**
 * AboutPortrait — the about page's anchor portrait, sharing the
 * chromatic-aberration parallax shader (see lib/media-gl.ts). Swaps between
 * light/dark source images on theme change, same pattern as FeatureWipe.
 * The parallax/chromatic-aberration GL effect itself is skipped under
 * reduced motion — the plain <img> fallback (.about-portrait__fallback)
 * stands in, same as FeatureWipe's images.
 */

import { useEffect, useRef } from "react";
import { MediaGL } from "@/lib/media-gl";
import { useTheme, resolveTheme } from "@/lib/use-theme";
import { useMotionPref } from "@/lib/motion-pref";

const SRC_LIGHT = "/images/about-img-light.jpg";
const SRC_DARK = "/images/about-img-dark.jpg";

function srcFor(theme: "light" | "dark") {
  return theme === "dark" ? SRC_DARK : SRC_LIGHT;
}

export function AboutPortrait() {
  const theme = useTheme();
  const motionPref = useMotionPref();
  const mediaRef  = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef     = useRef<MediaGL | null>(null);

  // Mount/unmount only — deliberately excludes `theme` from its deps. A
  // theme change is handled below via setSrc() on the already-live
  // instance, not by tearing this whole effect down and back up: doing
  // that on every mount was the actual bug here. `theme` (from useTheme())
  // can read "light" for one render even when the saved preference is dark
  // (see resolveTheme's comment in lib/use-theme.ts), and having it in this
  // effect's deps meant that lag corrected itself a render later by
  // disposing and immediately reconstructing this same canvas's MediaGL
  // instance — that rapid dispose-then-recreate cycle on one GL context is
  // a known trigger for the GPU-driver-level texture corruption described
  // in media-gl.ts's _build(), and was reliably leaving the portrait
  // showing a flat, wrong-looking color instead of the photo. Using
  // resolveTheme() (a direct DOM read) for the initial src sidesteps the
  // lag entirely, so there's nothing left for a second effect run to fix.
  useEffect(() => {
    const media  = mediaRef.current;
    const canvas = canvasRef.current;
    if (!media || !canvas || motionPref === "off") return;

    glRef.current = new MediaGL(canvas, {
      src: srcFor(resolveTheme()),
      effect: "parallax",
      intensity: 1.5,
      onReady: () => media.classList.add("is-gl"),
    });

    return () => {
      glRef.current?.dispose(true);
      glRef.current = null;
      media.classList.remove("is-gl");
    };
  }, [motionPref]);

  // Theme toggles: swap the texture on the live instance instead of
  // rebuilding it. Separate effect (not folded into the one above) so a
  // real toggle mid-session only re-uploads the texture, never disposes
  // and reconstructs the GL context.
  useEffect(() => {
    glRef.current?.setSrc(srcFor(theme));
  }, [theme]);

  return (
    <div ref={mediaRef} className="about-portrait" role="img" aria-label="Travis Hall">
      <div className="about-portrait__fallback" aria-hidden="true" />
      <canvas ref={canvasRef} className="about-portrait__gl" aria-hidden="true" />
    </div>
  );
}
