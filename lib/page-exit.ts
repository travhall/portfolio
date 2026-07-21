// page-exit.ts — lets the currently-mounted page register an "exit"
// animation to run before a navigation away from it, so navigation triggers
// OUTSIDE that page's own component tree (e.g. the topbar wordmark, a
// root-layout singleton) can invoke it too — not just the page's own in-page
// buttons. See plan 031: CaseStudyHero's "back home" button already plays an
// exit animation before navigating; this lets the topbar wordmark trigger
// that same exit when clicked from a case-study page, instead of navigating
// away with no animation on the page's own content.
//
// Two registries, two different jobs:
//   - activeHandler (registerPageExit/tryPageExit) — a single slot. This
//     app's routing model only ever has one component that OWNS navigation
//     for a page-level exit at a time (e.g. CaseStudyHero's exitHome, which
//     calls router.push once its own timeline completes).
//   - observers (registerExitObserver) — a set. Any number of OTHER
//     components on the same page can ask to play their own exit animation
//     in sync with that same page-level exit, without taking over
//     navigation themselves. See plan 034: CaseStudyNav uses this so its
//     "More Work" cards wipe away alongside CaseStudyHero's own exit,
//     instead of just disappearing when the route changes underneath them.

type ExitHandler = (href: string) => void;

let activeHandler: ExitHandler | null = null;
const observers = new Set<ExitHandler>();

/**
 * Called by a page's own exit-capable component (e.g. CaseStudyHero) on
 * mount, to register its exit animation. Returns an unregister function —
 * call it on unmount. Registering a new handler while one is already active
 * simply replaces it (matches this app's one-page-at-a-time routing model).
 */
export function registerPageExit(handler: ExitHandler): () => void {
  activeHandler = handler;
  return () => {
    if (activeHandler === handler) activeHandler = null;
  };
}

/**
 * Called by any other component on the same page that wants to play its
 * own exit animation whenever tryPageExit fires — WITHOUT owning
 * navigation (only the registerPageExit handler calls router.push).
 * Returns an unregister function — call it on unmount. Safe to register
 * more than one observer at a time (unlike registerPageExit's single slot).
 */
export function registerExitObserver(handler: ExitHandler): () => void {
  observers.add(handler);
  return () => {
    observers.delete(handler);
  };
}

/**
 * Called by a navigation trigger outside the current page's own component
 * tree (e.g. the topbar wordmark) before navigating to `href`. If the
 * current page has registered an exit handler, fires every registered
 * observer (fire-and-forget — they don't navigate) and then hands off to
 * the primary handler — which is responsible for animating and then
 * navigating itself — and returns true, meaning the caller should NOT also
 * navigate. Returns false if nothing is registered (e.g. the user is on a
 * page with no exit animation), meaning the caller should proceed with its
 * own normal navigation.
 */
export function tryPageExit(href: string): boolean {
  if (!activeHandler) return false;
  observers.forEach((observer) => observer(href));
  activeHandler(href);
  return true;
}
