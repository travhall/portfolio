'use client';

/**
 * ContrastSwatch — renders a text/background token pairing *as it's actually
 * used* (real type class, real CSS vars) and measures the live WCAG contrast
 * ratio via a 1×1 canvas (handles oklch/color-mix by letting the browser
 * resolve to sRGB). Re-measures whenever the theme changes — toggle the
 * ThemeToggle above and every ratio + pass/fail badge updates in place.
 */

import { useEffect, useRef, useState } from 'react';

interface Props {
  fgVar: string;
  bgVar: string;
  sample: string;
  sampleClassName?: string;
  context: string;
}

let sharedCtx: CanvasRenderingContext2D | null = null;
function toRGB(color: string): [number, number, number, number] {
  if (!sharedCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    sharedCtx = canvas.getContext('2d', { willReadFrequently: true });
  }
  const ctx = sharedCtx!;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

function relativeLuminance([r, g, b]: number[]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg: string, bg: string) {
  // Composite fg over bg first in case fg carries alpha (e.g. muted overlays).
  const [br, bg_, bb] = toRGB(bg);
  const [fr, fg_, fb, fa] = toRGB(fg);
  const composited = [
    fr * fa + br * (1 - fa),
    fg_ * fa + bg_ * (1 - fa),
    fb * fa + bb * (1 - fa),
  ];
  const lFg = relativeLuminance(composited);
  const lBg = relativeLuminance([br, bg_, bb]);
  const [lighter, darker] = lFg > lBg ? [lFg, lBg] : [lBg, lFg];
  return (lighter + 0.05) / (darker + 0.05);
}

export function ContrastSwatch({ fgVar, bgVar, sample, sampleClassName = '', context }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      setRatio(contrastRatio(cs.color, cs.backgroundColor));
    };

    measure();

    // Re-measure whenever the manual theme toggle (data-theme on <html>)
    // or the OS color scheme (when in "auto" mode) changes.
    const observer = new MutationObserver(measure);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', measure);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', measure);
    };
  }, []);

  const aa = ratio !== null && ratio >= 4.5;
  const aaa = ratio !== null && ratio >= 7;
  const aaLarge = ratio !== null && ratio >= 3;

  return (
    <div className="kit-pairing">
      <div ref={ref} className="kit-pairing__demo" style={{ background: `var(${bgVar})`, color: `var(${fgVar})` }}>
        <p className={`${sampleClassName} kit-pairing__sample`}>{sample}</p>
      </div>
      <div className="kit-pairing__meta">
        <span className="type-mono text-ink kit-pairing__tokens">
          {fgVar} <span className="text-ink-muted">on</span> {bgVar}
        </span>
        <span className="type-caption text-ink-muted">{context}</span>
        <div className="kit-pairing__ratio" aria-live="polite">
          <span className="type-small kit-pairing__ratio-value">
            {ratio !== null ? `${ratio.toFixed(2)}:1` : '—'}
          </span>
          <span className={`kit-badge ${aa ? 'kit-badge--pass' : 'kit-badge--fail'}`}>
            AA {aa ? 'pass' : 'fail'}
          </span>
          <span className={`kit-badge ${aaa ? 'kit-badge--pass' : 'kit-badge--fail'}`}>
            AAA {aaa ? 'pass' : 'fail'}
          </span>
          <span className={`kit-badge ${aaLarge ? 'kit-badge--pass' : 'kit-badge--fail'}`}>
            Large/UI {aaLarge ? 'pass' : 'fail'}
          </span>
        </div>
      </div>
    </div>
  );
}
