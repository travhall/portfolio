"use client";

/**
 * SunMoonIcon — animated sun → moon SVG for ThemeToggle.
 *
 * Icon standard: 1.6px stroke, round caps, 16×16px (scaled from 24px grid).
 *
 * Variant C morph:
 *   — Whole group rotates −45° to dark (tilt clarifies the crescent).
 *   — Core circle grows and shifts left (sun radius 2.4 → moon radius 3.4).
 *   — 8 rays collapse via stroke-dashoffset.
 *   — Occluder circle slides in from off-canvas to cut the crescent bite,
 *     filled with CSS var(--surface) so it always matches the background.
 */

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface SunMoonHandle {
  animate(toDark: boolean): void;
}

interface Props {
  dark:  boolean;
  size?: number;
}

const EASE    = "cubic-bezier(0.22,1,0.36,1)";
const DUR     = "0.42s";
const RAY_DUR = "0.25s";

// Ray endpoints — 8 spokes at 45° on a 16px viewBox
const RAYS: [number, number, number, number][] = [
  [8,    3.5,  8,     2    ],
  [11.3, 4.7,  12.36, 3.64 ],
  [12.5, 8,    14,    8    ],
  [11.3, 11.3, 12.36, 12.36],
  [8,    12.5, 8,     14   ],
  [4.7,  11.3, 3.64,  12.36],
  [3.5,  8,    2,     8    ],
  [4.7,  4.7,  3.64,  3.64 ],
];

export const SunMoonIcon = forwardRef<SunMoonHandle, Props>(
  function SunMoonIcon({ dark, size = 16 }, ref) {
    const groupRef = useRef<SVGGElement>(null);
    const coreRef  = useRef<SVGCircleElement>(null);
    const occRef   = useRef<SVGCircleElement>(null);
    const rayRefs  = useRef<(SVGLineElement | null)[]>([]);

    useImperativeHandle(ref, () => ({
      animate(toDark: boolean) {
        const group = groupRef.current;
        const core  = coreRef.current;
        const occ   = occRef.current;
        const rays  = rayRefs.current.filter(Boolean) as SVGLineElement[];
        if (!group || !core || !occ) return;

        group.style.transition = `transform ${DUR} ${EASE}`;
        core.style.transition  = `r ${DUR} ${EASE}, cx ${DUR} ${EASE}`;
        occ.style.transition   = `cx ${DUR} ${EASE}, opacity ${DUR} ${EASE}`;
        rays.forEach(r => {
          r.style.transition =
            `stroke-dashoffset ${RAY_DUR} ${EASE}, opacity 0.2s ease`;
        });

        if (toDark) {
          group.style.transform    = "rotate(-45deg)";
          core.setAttribute("cx",  "7.2");
          core.setAttribute("r",   "3.4");
          occ.setAttribute("cx",   "10");
          occ.setAttribute("opacity", "1");
          rays.forEach(r => {
            r.style.strokeDashoffset = "2.2";
            r.style.opacity = "0";
          });
        } else {
          group.style.transform = "rotate(0deg)";
          core.setAttribute("cx", "8");
          core.setAttribute("r",  "2.4");
          occ.setAttribute("cx",  "22");
          occ.setAttribute("opacity", "0");
          rays.forEach(r => {
            r.style.strokeDashoffset = "0";
            r.style.opacity = "1";
          });
        }
      },
    }));

    const rayProps = {
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round" as const,
      strokeDasharray: "2.2",
    };

    return (
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        aria-hidden="true"
        style={{ overflow: "visible", display: "block", flex: "none" }}
      >
        <g
          ref={groupRef}
          style={{
            transformOrigin: "8px 8px",
            transform: dark ? "rotate(-45deg)" : "rotate(0deg)",
          }}
        >
          <circle
            ref={coreRef}
            cx={dark ? 7.2 : 8}
            cy={8}
            r={dark ? 3.4 : 2.4}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
          />

          {RAYS.map(([x1, y1, x2, y2], i) => (
            <line
              key={i}
              ref={el => { rayRefs.current[i] = el; }}
              x1={x1} y1={y1} x2={x2} y2={y2}
              {...rayProps}
              strokeDashoffset={dark ? "2.2" : "0"}
              style={{ opacity: dark ? 0 : 1 }}
            />
          ))}

          <circle
            ref={occRef}
            cx={dark ? 10 : 22}
            cy={7.5}
            r={3.4}
            fill="var(--surface)"
            stroke="none"
            opacity={dark ? 1 : 0}
          />
        </g>
      </svg>
    );
  }
);
