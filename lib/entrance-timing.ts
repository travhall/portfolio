// entrance-timing.ts — shared delays for the home page's on-load entrance
// choreography, so the sequence lives in one place instead of scattered magic
// numbers across three components. Follows the same "single source of truth for
// a cross-file constant" convention as lib/breakpoints.ts (DESKTOP_BP).
//
// The load entrance arrives in this order (seconds, GSAP timeline delays):
//   0.10  wordmark characters cascade up            (Topbar)
//   0.20  hero statement characters cascade up       (IntroSection)
//   0.28  menu button wipes up                        (Topbar)
//   0.45  first project image un-clips + AB burst     (FeatureWipe row 0)
//
// Only the *delays* (sequence) are centralized here. Per-element durations,
// staggers, and eases stay local to each component — they're local feel, not
// cross-component ordering.
//
// Consumed by: components/nav/Topbar.tsx, components/features/IntroSection.tsx,
// components/features/FeatureWipe.tsx. Reduced motion skips the entrance
// entirely in every consumer, so these values never apply when motion is off. cSpell:ignore wordmark topbar

export const ENTRANCE_DELAY = {
  wordmark: 0.1,
  statement: 0.2,
  menuButton: 0.28,
  firstImage: 0.45,
} as const;
