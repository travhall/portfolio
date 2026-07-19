// page-exit.ts — lets the currently-mounted page register an "exit"
// animation to run before a navigation away from it, so navigation triggers
// OUTSIDE that page's own component tree (e.g. the topbar wordmark, a
// root-layout singleton) can invoke it too — not just the page's own in-page
// buttons. See plan 031: CaseStudyHero's "back home" button already plays an
// exit animation before navigating; this lets the topbar wordmark trigger
// that same exit when clicked from a case-study page, instead of navigating
// away with no animation on the page's own content.
//
// A single global slot, not a stack — this app's routing model only ever has
// one page mounted (and thus one exit handler registered) at a time.

type ExitHandler = (href: string) => void;

let activeHandler: ExitHandler | null = null;

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
 * Called by a navigation trigger outside the current page's own component
 * tree (e.g. the topbar wordmark) before navigating to `href`. If the
 * current page has registered an exit handler, hands off to it — which is
 * responsible for animating and then navigating itself — and returns true,
 * meaning the caller should NOT also navigate. Returns false if nothing is
 * registered (e.g. the user is on a page with no exit animation), meaning
 * the caller should proceed with its own normal navigation.
 */
export function tryPageExit(href: string): boolean {
  if (!activeHandler) return false;
  activeHandler(href);
  return true;
}
