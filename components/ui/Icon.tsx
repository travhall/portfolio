import type { CSSProperties, SVGProps } from "react";

// A small set of clean line icons tuned to the site's minimal, hairline
// aesthetic (1.6px stroke, round caps, 24px grid, currentColor).
const STROKE: SVGProps<SVGPathElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const PATHS = {
  "arrow-right": (
    <>
      <path d="M4 12h15" {...STROKE} />
      <path d="M13 6l6 6-6 6" {...STROKE} />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M7 17 17 7" {...STROKE} />
      <path d="M8 7h9v9" {...STROKE} />
    </>
  ),
  "arrow-down": (
    <>
      <path d="M12 4v15" {...STROKE} />
      <path d="M6 13l6 6 6-6" {...STROKE} />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" {...STROKE} />
      <path d="M7 11l5 5 5-5" {...STROKE} />
      <path d="M5 21h14" {...STROKE} />
    </>
  ),
  external: (
    <>
      <path d="M14 5h5v5" {...STROKE} />
      <path d="M19 5l-8 8" {...STROKE} />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" {...STROKE} />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" {...STROKE} />
      <path d="M5 12h14" {...STROKE} />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12" {...STROKE} />
      <path d="M18 6 6 18" {...STROKE} />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7" {...STROKE} />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 7 8 6 8-6" {...STROKE} />
    </>
  ),
  github: (
    <path
      d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"
      {...STROKE}
    />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <path d="M8 11v6" {...STROKE} />
      <path d="M12 17v-6" {...STROKE} />
      <path d="M12 13c0-1.4 1.1-2 2.2-2 1.4 0 2.8 1 2.8 3v3" {...STROKE} />
    </>
  ),
  send: (
    <>
      <path d="M21 4 3 11l7 2.5L13 21l8-17z" {...STROKE} />
      <path d="M10 13.5 21 4" {...STROKE} />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" {...STROKE} />
    </>
  ),
  play: <path d="M7 5l11 7-11 7V5z" {...STROKE} fill="currentColor" stroke="none" />,
  "chevron-down": <path d="M6 9l6 6 6-6" {...STROKE} />,
  menu: (
    <>
      <path d="M4 8h16" {...STROKE} />
      <path d="M4 16h16" {...STROKE} />
    </>
  ),
  sparkle: (
    <path
      d="M12 4c.6 3.8 2.2 5.4 6 6-3.8.6-5.4 2.2-6 6-.6-3.8-2.2-5.4-6-6 3.8-.6 5.4-2.2 6-6z"
      {...STROKE}
    />
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.1 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H8.5a1.65 1.65 0 0 0 1-1.51V2.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1h.59a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        {...STROKE}
      />
    </>
  ),
  motion: <path d="M3 12h3l2.5-7 4 14 2.5-7h6" {...STROKE} />,
  sun: (
    <>
      <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        {...STROKE}
      />
    </>
  ),
  moon: (
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      {...STROKE}
    />
  ),
} as const;

export type IconName = keyof typeof PATHS;

export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export function Icon({
  name,
  size,
  style,
  className,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const body = PATHS[name];
  if (!body) return null;
  const dimensions = size ? { width: size, height: size } : null;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      style={{ ...dimensions, ...style }}
    >
      {body}
    </svg>
  );
}
