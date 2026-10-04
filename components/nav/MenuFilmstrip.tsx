"use client";

/**
 * MenuFilmstrip — the menu's case-study browser: an info panel (left) for
 * the active study, beside a horizontally scrolling strip of every top-level
 * case study (right). The active card is the one parked at the strip's
 * left edge — it's wide and in full color; the rest are narrow greyscale
 * slivers. Scrolling/swiping changes the active card live.
 *
 * Stable snap positions — only the active card is wide, and it always sits
 * at the strip's left edge, so every card *before* it is narrow. Card i's
 * left edge is therefore always i × step (narrow width + gap), whichever
 * card is active. Snapping uses invisible markers at those fixed offsets
 * (not the cards themselves, whose positions shift as the wide card moves),
 * and the active index is just round(scrollLeft / step). A trailing spacer
 * lets the last card reach the left edge.
 *
 * Input — trackpad/touch scroll natively (CSS scroll-snap). Vertical mouse
 * wheel anywhere in the menu steps one card per gesture. Mouse drag scrolls
 * the strip (a drag never counts as a click). Focusing a card (Tab) or
 * pressing ←/→ in the strip scrolls that card into the active slot.
 *
 * Images — each card's <img> is upgraded to a MediaGL canvas while the
 * menu is open (disposed shortly after it closes), giving the strip the
 * site-wide image language: the chromatic-aberration burst as cards wipe
 * in, the hover wave, and the wipe + burst exit on click — all mirroring
 * CaseStudyCard.tsx / FeatureWipe.tsx.
 *
 * Panel text — FeatureWipe's text language, end to end: the eyebrow slides
 * in from the left, the headline's characters cascade up out of per-line
 * clip masks (SplitText, same .line-mask/.char-inner as everywhere else),
 * and the tagline + button rise in. Changing the active card plays the
 * outgoing study's reveal in reverse while the incoming one plays forward;
 * opening the menu plays the active study's reveal once. The button also
 * borrows FeatureWipe's per-project label (buttonText) and colors
 * (--cs-button-*), and hovering/focusing it runs the image's hover wave
 * from the edge nearest the text.
 *
 * Click — FeatureWipe's page exit: the text reveal reversed at its exit
 * timings, every card clip-wiping closed with an aberration burst, then
 * navigation.
 *
 * Steady height — the info panel renders every study's details stacked in
 * one grid cell, only the active one visible, so the panel is always as tall
 * as its tallest entry. Changing the active card never resizes the panel or
 * (on mobile, where the panel sits below the strip) the cards.
 *
 * Lenis is stopped while the menu is open and would otherwise swallow wheel
 * events — data-lenis-prevent hands the strip back to native scrolling.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import type { CaseStudy } from "@/lib/case-studies";
import { resolveThemeVars } from "@/lib/case-study-theme";
import { Button } from "@/components/ui/Button";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { MediaGL } from "@/lib/media-gl";

interface Props {
  studies: CaseStudy[];
  isOpen: boolean;
  /** slug of the case study currently on screen, if any — the strip opens
   *  parked on it */
  currentSlug: string | null;
  /** close the menu and go to `href`; `origin` is the click point the
   *  menu's close ripple radiates from */
  onNavigate: (href: string, origin: { x: number; y: number }) => void;
}

// Wheel → one card per gesture: a step fires once the gesture's accumulated
// delta passes the threshold, then waits for the wheel to go quiet (or the
// max lock to pass) before another step can fire — keeps trackpad inertia
// from racing through every card.
const WHEEL_THRESHOLD = 30;
const WHEEL_IDLE_MS = 140;
const WHEEL_MAX_LOCK_MS = 700;
const DRAG_SLOP = 6;

// Matches CaseStudyCard.tsx / FeatureWipe.tsx / CaseStudyHero.tsx.
const IMG_INTENSITY = 1.8;
const HIDDEN_CLIP = "inset(0% 0% 0% 100%)";
// How long MediaGL instances outlive a close — past the overlay's own close
// animation, so nothing visibly drops back to the plain <img> mid-fade.
const GL_DISPOSE_DELAY_MS = 800;

const isModified = (e: MouseEvent) =>
  e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

gsap.registerPlugin(SplitText);

// ── Panel text transitions (FeatureWipe's reveal language) ──────────────────
// Everything is queried at call time — the headline's .char-inner spans are
// rebuilt whenever the split is redone (fonts ready, panel resize).

const infoParts = (info: HTMLElement) => ({
  eyebrow: info.querySelector<HTMLElement>(".eyebrow-inner"),
  title: info.querySelector<HTMLElement>(".menu-film__title"),
  chars: info.querySelectorAll<HTMLElement>(".char-inner"),
  rise: info.querySelectorAll<HTMLElement>(
    ".menu-film__tagline, .menu-film__cta",
  ),
});

/** Jump an info block straight to shown/hidden — no animation. */
function setInfoShown(info: HTMLElement, shown: boolean) {
  const { eyebrow, title, chars, rise } = infoParts(info);
  gsap.set(info, { visibility: shown ? "visible" : "hidden" });
  if (eyebrow)
    gsap.set(eyebrow, { opacity: shown ? 1 : 0, x: shown ? 0 : -14 });
  if (chars.length) gsap.set(chars, { yPercent: shown ? 0 : 105 });
  else if (title) gsap.set(title, { opacity: shown ? 1 : 0 });
  if (rise.length)
    gsap.set(rise, { opacity: shown ? 1 : 0, y: shown ? 0 : 20 });
}

/** FeatureWipe's entrance: eyebrow slides in from the left, headline chars
 *  cascade up from their clip masks, tagline + button rise. */
function revealInfoIn(info: HTMLElement, delay = 0) {
  const { eyebrow, title, chars, rise } = infoParts(info);
  const tl = gsap.timeline({ delay, defaults: { ease: "power2.out" } });
  tl.set(info, { visibility: "visible" }, 0);
  if (eyebrow) {
    tl.fromTo(
      eyebrow,
      { opacity: 0, x: -14 },
      { opacity: 1, x: 0, duration: 0.5 },
      0,
    );
  }
  if (chars.length) {
    tl.fromTo(
      chars,
      { yPercent: 105 },
      {
        yPercent: 0,
        ease: "power3.out",
        duration: 0.75,
        stagger: { amount: 0.35 },
      },
      0,
    );
  } else if (title) {
    tl.fromTo(title, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0);
  }
  if (rise.length) {
    tl.fromTo(
      rise,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 },
      0.15,
    );
  }
  return tl;
}

/** FeatureWipe's exit — the entrance reversed: chars fall back into the
 *  mask from the end, eyebrow slides back out left, the rest drops away.
 *  `pace` scales it: 1 for the page exit (FeatureWipe's runExit timings),
 *  quicker for a card-to-card swap. */
function revealInfoOut(info: HTMLElement, pace = 1) {
  const { eyebrow, title, chars, rise } = infoParts(info);
  const tl = gsap.timeline({ defaults: { ease: "power2.in" } });
  if (chars.length) {
    tl.to(
      chars,
      {
        yPercent: 105,
        duration: 0.45 * pace,
        stagger: { amount: 0.2 * pace, from: "end" },
      },
      0,
    );
  } else if (title) {
    tl.to(title, { opacity: 0, duration: 0.35 * pace }, 0);
  }
  if (eyebrow) tl.to(eyebrow, { opacity: 0, x: -14, duration: 0.35 * pace }, 0);
  if (rise.length) tl.to(rise, { opacity: 0, y: 20, duration: 0.4 * pace }, 0);
  tl.set(info, { visibility: "hidden" });
  return tl;
}

// Card-to-card swaps run the exit quicker than a page exit, so the incoming
// study isn't waiting on the outgoing one while the strip is moving.
const SWAP_OUT_PACE = 0.6;
const SWAP_IN_DELAY = 0.12;
// Open: the active study's reveal lands as the overlay settles and the
// cards wipe in (MenuOverlay's open timeline).
const OPEN_IN_DELAY = 0.35;

export function MenuFilmstrip({
  studies,
  isOpen,
  currentSlug,
  onNavigate,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLElement[]>([]);
  const canvasesRef = useRef<(HTMLCanvasElement | null)[]>([]);
  const glsRef = useRef<(MediaGL | null)[]>([]);
  const exitTlRef = useRef<gsap.core.Timeline | null>(null);
  const infoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const infoTlsRef = useRef<(gsap.core.Timeline | null)[]>([]);
  // Index of the study whose info is currently shown (or animating in).
  const shownRef = useRef<number | null>(null);
  const isOpenRef = useRef(isOpen);
  // The previous open's deferred MediaGL teardown, if it hasn't run yet.
  const pendingDisposeRef = useRef<(() => void) | null>(null);
  const markersRef = useRef<HTMLSpanElement[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  // Index a programmatic (smooth) scroll is heading to, until it lands —
  // so a second wheel step mid-flight advances from the destination, not
  // from wherever the animation happens to be.
  const targetRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  const clamp = useCallback(
    (i: number) => Math.max(0, Math.min(studies.length - 1, i)),
    [studies.length],
  );
  const step = () => markersRef.current[1]?.offsetLeft || 1;

  const scrollToIndex = useCallback(
    (i: number, instant = false) => {
      const idx = clamp(i);
      targetRef.current = instant ? null : idx;
      scrollerRef.current?.scrollTo({
        left: idx * step(),
        behavior: instant || prefersReducedMotion() ? "instant" : "smooth",
      });
    },
    [clamp],
  );

  // ── Active index from scroll position ──────────────────────────────────
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const exact = scroller.scrollLeft / step();
      if (
        targetRef.current !== null &&
        Math.abs(exact - targetRef.current) < 0.02
      ) {
        targetRef.current = null;
      }
      const idx = clamp(Math.round(exact));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    };
    // A user-driven scroll (touch/trackpad/drag) supersedes any pending
    // programmatic target.
    const onUserScroll = () => {
      targetRef.current = null;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("pointerdown", onUserScroll);
    scroller.addEventListener("touchstart", onUserScroll, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("pointerdown", onUserScroll);
      scroller.removeEventListener("touchstart", onUserScroll);
    };
  }, [clamp]);

  // ── Park on the current route's study each time the menu opens ─────────
  // The scroll listener above picks up the new active index. Also undoes a
  // previous click's exit (MenuOverlay's open timeline re-wipes the cards
  // in; the panel text is reset here), and cancels one still in flight if
  // the menu closes mid-exit (e.g. Escape) — so that click never navigates.
  useLayoutEffect(() => {
    isOpenRef.current = isOpen;
    exitTlRef.current?.kill();
    exitTlRef.current = null;
    if (!isOpen) return;
    const idx = Math.max(
      0,
      studies.findIndex((s) => s.slug === currentSlug),
    );

    // MenuOverlay's close timeline leaves the panel faded out — reset it,
    // then show only this study's info, playing its reveal.
    gsap.set(panelRef.current, { clearProps: "opacity,transform" });
    infoTlsRef.current.forEach((tl) => tl?.kill());
    infoRefs.current.forEach((info, i) => {
      if (info) setInfoShown(info, false);
      infoTlsRef.current[i] = null;
    });
    shownRef.current = idx;
    const info = infoRefs.current[idx];
    if (info) {
      if (prefersReducedMotion()) setInfoShown(info, true);
      else infoTlsRef.current[idx] = revealInfoIn(info, OPEN_IN_DELAY);
    }

    scrollToIndex(idx, true);
  }, [isOpen, currentSlug, studies, scrollToIndex]);

  // ── Panel text: swap reveals as the active card changes ────────────────
  useEffect(() => {
    const prev = shownRef.current;
    if (prev === active) return;
    shownRef.current = active;
    const animate =
      isOpenRef.current && !prefersReducedMotion() && !exitTlRef.current;

    const swap = (i: number, show: boolean) => {
      const info = infoRefs.current[i];
      if (!info) return;
      infoTlsRef.current[i]?.kill();
      infoTlsRef.current[i] = null;
      if (!animate) {
        setInfoShown(info, show);
        return;
      }
      infoTlsRef.current[i] = show
        ? revealInfoIn(info, SWAP_IN_DELAY)
        : revealInfoOut(info, SWAP_OUT_PACE);
    };
    if (prev !== null) swap(prev, false);
    swap(active, true);
  }, [active]);

  // ── Headline splits (lines + chars) for the reveal ─────────────────────
  // Split once fonts are ready (so line breaks match final metrics), and
  // again whenever the panel's width changes (line masks don't re-wrap on
  // their own). Each re-split snaps every block to its resting state.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    let splits: SplitText[] = [];
    let cancelled = false;
    let lastWidth = panel.offsetWidth;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const split = () => {
      splits.forEach((sp) => sp.revert());
      splits = [];
      infoRefs.current.forEach((info, i) => {
        if (!info) return;
        const title = info.querySelector<HTMLElement>(".menu-film__title");
        if (title) {
          splits.push(
            new SplitText(title, {
              type: "lines,chars",
              linesClass: "line-mask",
              charsClass: "char-inner",
            }),
          );
        }
        // Only touch blocks the menu has already taken over (inline
        // visibility) — before the first open, CSS owns the initial state.
        if (info.style.visibility) {
          infoTlsRef.current[i]?.kill();
          infoTlsRef.current[i] = null;
          setInfoShown(info, i === shownRef.current);
        }
      });
    };

    document.fonts.ready.then(() => {
      if (!cancelled) split();
    });
    const ro = new ResizeObserver(() => {
      const w = panel.offsetWidth;
      if (w === lastWidth) return;
      lastWidth = w;
      clearTimeout(timer);
      timer = setTimeout(split, 150);
    });
    ro.observe(panel);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ro.disconnect();
      splits.forEach((sp) => sp.revert());
    };
  }, []);

  // ── MediaGL: upgrade card images while the menu is open ────────────────
  useEffect(() => {
    if (!isOpen) return;
    // Reopened before the last close's teardown ran — run it now, before
    // new instances claim the same canvases (dispose releases the context).
    pendingDisposeRef.current?.();
    if (prefersReducedMotion()) return;
    const canvases = [...canvasesRef.current];
    const gls = studies.map((study, i) => {
      const canvas = canvases[i];
      if (study.comingSoon || !canvas) return null;
      const gl: MediaGL = new MediaGL(canvas, {
        src: study.image,
        effect: "parallax",
        intensity: IMG_INTENSITY,
        // Only the entrance/exit bursts below drive the aberration — not
        // page scroll (see CaseStudyCard.tsx).
        externalScroll: true,
        onReady: () => {
          canvas.parentElement?.classList.add("is-gl");
          // Entrance burst — starts at max aberration, eases to crisp,
          // landing alongside MenuOverlay's clip-path wipe-in.
          const burst = { vel: 1 };
          gsap.to(burst, {
            vel: 0,
            duration: 1.0,
            ease: "power2.out",
            onUpdate: () => gl.setScrollState(burst.vel, 0.5),
          });
        },
      });
      // Hover wave radiates from the image edge nearest the panel text, as
      // in FeatureWipe — left edge on desktop (panel beside the strip),
      // bottom edge on mobile (panel below it).
      if (window.matchMedia("(max-width: 899px)").matches) gl.setOrigin(0.5, 1);
      else gl.setOrigin(0, 0.5);
      return gl;
    });
    glsRef.current = gls;

    return () => {
      glsRef.current = [];
      const dispose = () => {
        clearTimeout(timer);
        pendingDisposeRef.current = null;
        gls.forEach((gl, i) => {
          if (!gl) return;
          gl.dispose();
          canvases[i]?.parentElement?.classList.remove("is-gl");
        });
      };
      const timer = setTimeout(dispose, GL_DISPOSE_DELAY_MS);
      pendingDisposeRef.current = dispose;
    };
  }, [isOpen, studies]);

  // ── Vertical wheel anywhere in the menu → one card per gesture ─────────
  useEffect(() => {
    if (!isOpen) return;
    let acc = 0;
    let locked = false;
    let lockedAt = 0;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const onWheel = (e: WheelEvent) => {
      // Horizontal-dominant gestures (trackpad swipe) scroll natively.
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      e.preventDefault();

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        locked = false;
        acc = 0;
      }, WHEEL_IDLE_MS);

      if (locked && performance.now() - lockedAt < WHEEL_MAX_LOCK_MS) return;
      locked = false;

      acc += e.deltaY;
      if (Math.abs(acc) < WHEEL_THRESHOLD) return;
      scrollToIndex((targetRef.current ?? activeRef.current) + Math.sign(acc));
      acc = 0;
      locked = true;
      lockedAt = performance.now();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      clearTimeout(idleTimer);
    };
  }, [isOpen, scrollToIndex]);

  // ── Mouse drag ─────────────────────────────────────────────────────────
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let startX = 0;
    let startLeft = 0;
    let pointerId: number | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startLeft = scroller.scrollLeft;
      draggedRef.current = false;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!draggedRef.current) {
        if (Math.abs(dx) < DRAG_SLOP) return;
        draggedRef.current = true;
        scroller.classList.add("is-dragging");
        scroller.setPointerCapture(e.pointerId);
      }
      scroller.scrollLeft = startLeft - dx;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      if (!draggedRef.current) return;
      scroller.classList.remove("is-dragging");
      if (scroller.hasPointerCapture(e.pointerId)) {
        scroller.releasePointerCapture(e.pointerId);
      }
      scrollToIndex(Math.round(scroller.scrollLeft / step()));
    };

    scroller.addEventListener("pointerdown", onDown);
    scroller.addEventListener("pointermove", onMove);
    scroller.addEventListener("pointerup", onUp);
    scroller.addEventListener("pointercancel", onUp);
    return () => {
      scroller.removeEventListener("pointerdown", onDown);
      scroller.removeEventListener("pointermove", onMove);
      scroller.removeEventListener("pointerup", onUp);
      scroller.removeEventListener("pointercancel", onUp);
    };
  }, [scrollToIndex]);

  // ── Click: the shared card exit, then navigate ─────────────────────────
  // Mirrors FeatureWipe.tsx's runExit: the text reveal reversed, every
  // image clip-wiping closed while its aberration ramps from crisp to max.
  const exit = (i: number, e: MouseEvent<HTMLElement>) => {
    if (isModified(e)) return;
    e.preventDefault();
    if (exitTlRef.current) return;

    const href = `/work/${studies[i].slug}`;
    const origin = { x: e.clientX, y: e.clientY };
    if (prefersReducedMotion()) {
      onNavigate(href, origin);
      return;
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.in" },
      onComplete: () => {
        exitTlRef.current = null;
        onNavigate(href, origin);
      },
    });
    exitTlRef.current = tl;

    const shown = shownRef.current;
    const info = shown !== null ? infoRefs.current[shown] : null;
    if (info) {
      infoTlsRef.current[shown!]?.kill();
      tl.add(revealInfoOut(info), 0);
    }
    // Every image wipes away together, as in FeatureWipe's runExit.
    tl.to(
      cardsRef.current,
      { clipPath: HIDDEN_CLIP, duration: 0.6, ease: "power2.inOut" },
      0,
    );
    const burst = { vel: 0 };
    tl.to(
      burst,
      {
        vel: 1,
        duration: 0.6,
        onUpdate: () =>
          glsRef.current.forEach((gl) => gl?.setScrollState(burst.vel, 0.5)),
      },
      0,
    );
  };

  if (studies.length === 0) return null;

  return (
    <div ref={rootRef} className="menu-film">
      {/* Info panel — every study's details stacked in one grid cell, only
          the active one visible (see header: keeps the panel's height
          constant). Hidden entries are visibility:hidden, so they're out of
          the tab order and a11y tree; polite live region announces the
          change as the strip scrolls. */}
      <div ref={panelRef} className="menu-film__panel" aria-live="polite">
        {studies.map((study, i) => {
          const themeVars = resolveThemeVars(study.theme);
          const buttonText = study.buttonText ?? "View Case Study";
          return (
            <div
              key={study.slug}
              ref={(el) => {
                infoRefs.current[i] = el;
              }}
              className={`menu-film__info${i === active ? " is-active" : ""}${themeVars ? " menu-film__info--themed" : ""}`}
              aria-hidden={i !== active}
              style={
                themeVars
                  ? ({
                      "--cs-button-bg": themeVars["--cs-button-bg"],
                      "--cs-button-fg": themeVars["--cs-button-fg"],
                      "--cs-button-border": themeVars["--cs-button-border"],
                    } as CSSProperties)
                  : undefined
              }
            >
              <p className="type-eyebrow text-ink-muted menu-film__eyebrow">
                <span className="eyebrow-inner">{study.eyebrow}</span>
              </p>
              <h2 className="type-h3 text-ink menu-film__title">
                {study.headline}
              </h2>
              {study.tagline && (
                <p className="type-body text-ink-muted menu-film__tagline">
                  {study.tagline}
                </p>
              )}
              {study.comingSoon ? (
                <p className="type-small text-ink-faint menu-film__cta">
                  Coming soon
                </p>
              ) : (
                <div className="menu-film__cta">
                  <Button
                    size="sm"
                    href={`/work/${study.slug}`}
                    icon="arrow-right"
                    iconPos="right"
                    aria-label={`${buttonText} — ${study.headline}`}
                    onClick={(e) => exit(i, e)}
                    onMouseEnter={() => glsRef.current[i]?.setHover(true)}
                    onMouseLeave={() => glsRef.current[i]?.setHover(false)}
                    onFocus={() => glsRef.current[i]?.setHover(true)}
                    onBlur={() => glsRef.current[i]?.setHover(false)}
                  >
                    {buttonText}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        ref={scrollerRef}
        className="menu-film__scroller"
        data-lenis-prevent
        role="region"
        aria-label="Case studies"
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          const next = clamp(
            (targetRef.current ?? activeRef.current) +
              (e.key === "ArrowRight" ? 1 : -1),
          );
          scrollToIndex(next);
          scrollerRef.current
            ?.querySelectorAll<HTMLElement>(".menu-film__card")
            [next]?.focus({ preventScroll: true });
        }}
      >
        <ul className="menu-film__track">
          {studies.map((s, i) => {
            const cardHref = `/work/${s.slug}`;
            const className = `menu-film__card${i === active ? " is-active" : ""}`;
            return (
              <li key={s.slug} className="menu-film__item">
                <span
                  ref={(el) => {
                    if (el) markersRef.current[i] = el;
                  }}
                  className="menu-film__snap"
                  style={{ "--i": i } as CSSProperties}
                  aria-hidden="true"
                />
                {s.comingSoon ? (
                  <span
                    ref={(el) => {
                      if (el) cardsRef.current[i] = el;
                    }}
                    className={`${className} is-disabled`}
                    tabIndex={0}
                    role="img"
                    aria-label={`${s.headline} (coming soon)`}
                    onFocus={() => scrollToIndex(i)}
                  >
                    <span className="menu-film__media menu-film__media--empty" />
                  </span>
                ) : (
                  <a
                    ref={(el) => {
                      if (el) cardsRef.current[i] = el;
                    }}
                    href={cardHref}
                    className={className}
                    aria-label={s.headline}
                    aria-current={s.slug === currentSlug ? "page" : undefined}
                    draggable={false}
                    onFocus={() => {
                      scrollToIndex(i);
                      glsRef.current[i]?.setHover(true);
                    }}
                    onBlur={() => glsRef.current[i]?.setHover(false)}
                    onMouseEnter={() => glsRef.current[i]?.setHover(true)}
                    onMouseLeave={() => glsRef.current[i]?.setHover(false)}
                    onClick={(e) => {
                      if (draggedRef.current) {
                        e.preventDefault();
                        draggedRef.current = false;
                        return;
                      }
                      exit(i, e);
                    }}
                  >
                    <span className="menu-film__media">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image}
                        alt=""
                        className="menu-film__img"
                        draggable={false}
                      />
                      <canvas
                        ref={(el) => {
                          canvasesRef.current[i] = el;
                        }}
                        className="menu-film__canvas"
                        aria-hidden="true"
                      />
                    </span>
                  </a>
                )}
              </li>
            );
          })}
          <li className="menu-film__tail" aria-hidden="true" />
        </ul>
      </div>
    </div>
  );
}
