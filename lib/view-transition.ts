// view-transition.ts — tracks the most recently started native View
// Transition (if any) so a component mounting as part of one (e.g. an
// arriving page's entrance) can wait for it to fully finish — the visual
// crossfade, not just the DOM update — before starting its own animation.
//
// Needed because next-view-transitions' own promise resolution (which
// controls when its push()/replace() calls consider the navigation "done")
// is decoupled from when the transition's own crossfade animation actually
// finishes playing — see plan 029 for the full trace. A fixed guessed delay
// (plan 028's first attempt) is fragile because the real duration varies
// with page-load conditions; this waits for the browser's own precise
// signal instead.
//
// Patches document.startViewTransition exactly once, at first import.
// Topbar.tsx imports this for its side effect (it's a root-layout
// singleton, mounted before any navigation is possible) to guarantee the
// patch is installed before the first real transition can occur.

let patched = false;
let currentFinished: Promise<void> = Promise.resolve();
let currentHadTransition = false;

function patch() {
  if (
    patched ||
    typeof document === "undefined" ||
    typeof document.startViewTransition !== "function"
  ) {
    return;
  }
  patched = true;

  const original = document.startViewTransition.bind(document);
  document.startViewTransition = ((
    callbackOptions?: Parameters<typeof original>[0],
  ) => {
    const transition = original(callbackOptions);
    currentHadTransition = true;
    currentFinished = transition.finished.catch(() => undefined);
    return transition;
  }) as typeof document.startViewTransition;
}

patch();

/**
 * Resolves once the most recently started view transition (if any) has
 * fully finished animating — the moment the new page is visually settled
 * and interactive. Resolves immediately if no transition is in flight
 * (e.g. a plain full page load never created one).
 *
 * Resolves to `true` if a real transition was awaited (a client-side
 * navigation), `false` if there was never one to wait on (a full page
 * load) — callers use this to skip a load-only sequencing delay that would
 * otherwise stack on top of the transition's own crossfade duration on a
 * client-side arrival. Read synchronously at call time (not inside the
 * `.then()`), so two consumers reacting to the same transition in the same
 * render commit (IntroSection and FeatureWipe both call this on every home
 * arrival) both see the correct value for *this* transition, not whichever
 * one resolved first.
 */
export function waitForActiveViewTransition(): Promise<boolean> {
  const hadTransition = currentHadTransition;
  return currentFinished.then(() => hadTransition);
}
