"use client";

/**
 * Topbar — fixed navigation bar + menu overlay controller.
 *
 * Wordmark (left) fades out as the user scrolls past the intro and restores
 * when they return to the top; it's pinned fully visible while the menu is
 * open. The menu button (right) is the single open/close toggle — it sits
 * above the overlay (higher z-index) so it stays put as the overlay covers
 * the page, rather than handing off to a second "close" button inside the
 * overlay.
 *
 * Owns the isOpen state for the MenuOverlay — keeps both co-located so the
 * button and overlay share a single source of truth.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { gsap } from "gsap";
import { MenuOverlay } from "./MenuOverlay";
import { prefersReducedMotion, triggerRipple } from "@/components/ui/ripple";
import { createTextReveal } from "@/lib/text-reveal";
import { siteConfig } from "@/lib/site-config";
import { ENTRANCE_DELAY } from "@/lib/entrance-timing";
import "@/lib/view-transition";
import { tryPageExit } from "@/lib/page-exit";
import { useMotionPref } from "@/lib/motion-pref";

const RIPPLE_BRAND = { strength: 9, size: 90, duration: 600 };
const RIPPLE_TOGGLE = { strength: 8, size: 80, duration: 550 };

export function Topbar() {
  const headerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuOriginRef = useRef({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const motionPref = useMotionPref();

  // ── Entrance reveal — ONCE per site load ────────────────────────────────
  // Topbar is a root-layout singleton, so this mount effect runs exactly once
  // and survives client navigations (it does not replay on route change).
  // The wordmark's characters cascade up out of their clip masks (the shared
  // text reveal); the menu button wipes up alongside it. useLayoutEffect sets
  // the hidden start state before the browser paints, so the server-rendered
  // visible chrome never flashes before the reveal begins. cSpell:ignore Topbar Wordmark navigations
  useLayoutEffect(() => {
    const brand = brandRef.current;
    const toggle = toggleRef.current;

    if (prefersReducedMotion()) {
      // Same masking problem as CaseStudyHero's entrance: the CSS
      // !important reduced-motion rules only cover the data-motion value
      // active right now. If this effect re-runs because the user just
      // toggled motion (no navigation needed — Topbar is a persistent
      // singleton), nothing else ever sets these inline styles, so toggling
      // motion back on drops the override and .topbar__toggle's default
      // clip-path: inset(110% 0% 0% 0%) — hidden — is exposed with nothing
      // left to un-hide it.
      if (brand) gsap.set(brand, { opacity: 1 });
      if (toggle) {
        gsap.set(toggle, { clipPath: "inset(0% 0% 0% 0%)" });
        // clearProps (not opacity: 1) so the CSS :hover opacity (0.6) rule
        // still applies — same reasoning as the animated path's onComplete
        // below.
        gsap.set(toggle, { clearProps: "opacity" });
      }
      return;
    }

    const cleanups: Array<() => void> = [];

    if (brand) {
      const reveal = createTextReveal(brand, {
        delay: ENTRANCE_DELAY.wordmark,
        duration: 0.7,
        stagger: 0.32,
      });
      let cancelled = false;
      reveal.ready.then(() => {
        if (!cancelled) reveal.tl.play();
      });
      cleanups.push(() => {
        cancelled = true;
        reveal.cleanup();
      });
    }

    if (toggle) {
      gsap.set(toggle, { clipPath: "inset(110% 0% 0% 0%)", opacity: 0 });
      const tween = gsap.to(toggle, {
        clipPath: "inset(0% 0% 0% 0%)",
        opacity: 1,
        ease: "power3.out",
        duration: 0.7,
        delay: ENTRANCE_DELAY.menuButton,
        // clearProps once done so the CSS :hover opacity (0.6) works again
        // instead of the tween's inline opacity: 1 pinning it.
        onComplete: () => gsap.set(toggle, { clearProps: "opacity" }),
      });
      cleanups.push(() => {
        tween.kill();
        gsap.set(toggle, { clearProps: "clipPath,opacity" });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [motionPref]);

  // Wordmark fade on scroll — pinned fully visible while the menu is open
  // so it can act as the overlay's "back to top / home" anchor.
  useEffect(() => {
    const el = brandRef.current;
    if (!el) return;

    if (isOpen) {
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
      return;
    }

    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const opacity = Math.max(0, 1 - y / 120);
      el.style.opacity = String(opacity.toFixed(3));
      el.style.pointerEvents = opacity < 0.05 ? "none" : "auto";
      ticking = false;
    };
    update();

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOpen]);

  // Closing always returns focus to the toggle button — whether triggered
  // by Escape, a nav link, or the toggle itself.
  const close = () => {
    setIsOpen(false);
    headerRef.current
      ?.querySelector<HTMLButtonElement>(".topbar__toggle")
      ?.focus();
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <>
      <header ref={headerRef} className="topbar" aria-label="Site navigation">
        <Link
          ref={brandRef}
          href="/"
          className="topbar__brand"
          onClick={(e: MouseEvent<HTMLAnchorElement>) => {
            if (!prefersReducedMotion())
              triggerRipple(e.currentTarget, e, RIPPLE_BRAND);

            if (pathname === "/") {
              // Already home — close the menu without re-running the route
              // transition/fade for a same-page "navigation".
              e.preventDefault();
            } else if (
              !(
                e.metaKey ||
                e.ctrlKey ||
                e.shiftKey ||
                e.altKey ||
                e.button !== 0
              ) &&
              tryPageExit("/")
            ) {
              // The current page has its own exit animation registered
              // (e.g. a case-study page, via CaseStudyHero) — hand off to
              // it instead of navigating immediately; it animates out, then
              // navigates itself. Modifier / non-primary clicks are left
              // alone (tryPageExit is never even called for them, so
              // next-view-transitions' own Link handles "open in new tab"
              // etc normally) — see lib/page-exit.ts.
              e.preventDefault();
            }

            close();
          }}
        >
          {siteConfig.host}
        </Link>
        <button
          ref={toggleRef}
          type="button"
          className="topbar__toggle"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="site-menu"
          onClick={(e) => {
            if (!prefersReducedMotion())
              triggerRipple(e.currentTarget, e, RIPPLE_TOGGLE);
            menuOriginRef.current = { x: e.clientX, y: e.clientY };
            setIsOpen((o) => !o);
          }}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`topbar__toggle-icon${isOpen ? " is-open" : ""}`}
          >
            <path
              className="topbar__toggle-line topbar__toggle-line--top"
              d="M4 8h16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
            <path
              className="topbar__toggle-line topbar__toggle-line--bot"
              d="M4 16h16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </svg>
          <span className="topbar__toggle-label">
            {isOpen ? "close" : "menu"}
          </span>
        </button>
      </header>

      <MenuOverlay isOpen={isOpen} onClose={close} originRef={menuOriginRef} />
    </>
  );
}
