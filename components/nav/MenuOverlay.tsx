"use client";

/**
 * MenuOverlay — full-screen glass takeover with a fade + settle animation.
 *
 * Open  — The overlay fades and scales in while its content layer eases from
 *         blurred to sharp — like glass settling into place. The header nav
 *         links fade in while it's still settling. At the same time, a
 *         water-ripple (the same SVG displacement technique used on buttons)
 *         radiates across the whole pane — background, blur and all — from
 *         the toggle button's click point, as if the button's tap dropped
 *         into the glass.
 *
 * Close — Nav links exit first, then the overlay fades/blurs back out, with
 *         a quicker ripple pulse from the same origin.
 *
 * Layout — a slim header band (nav links, aligned to the same row the fixed
 *          Topbar's wordmark/close occupy above it) sits over an empty
 *          content area reserved for the case-study filmstrip (not designed
 *          yet), with the settings + social row pinned to the bottom. cSpell:ignore wordmark
 *
 * Theme/motion toggles — write data-theme / data-motion attributes on <html>
 *                so the CSS [data-theme]/[data-motion] overrides take effect
 *                instantly (see lib/motion-pref.ts for the motion override).
 *
 * Focus — the overlay is `inert` while closed (removes its links from the tab
 *         order and the a11y tree). On open, focus moves to the first nav
 *         link and Tab/Shift+Tab is trapped within the overlay's links and
 *         controls. The Topbar's menu button is the only open/close control
 *         and remains visible above the overlay throughout. cSpell:ignore Topbar
 */

import { useEffect, useRef, type RefObject } from "react";
import { usePathname } from "next/navigation";
import { Link, useTransitionRouter } from "next-view-transitions";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/ui/EmailButton";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MotionToggle } from "@/components/ui/MotionToggle";
import { useLenis } from "@/components/providers/SmoothScroll";
import { prefersReducedMotion, triggerRipple } from "@/components/ui/ripple";
import { siteConfig } from "@/lib/site-config";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** viewport point the open/close ripple should radiate from (the toggle button's click) */
  originRef: RefObject<{ x: number; y: number }>;
}

const NAV_LINKS = [
  { label: "All Work", href: "/work" },
  { label: "About Me", href: "/about" },
];

// Same water-ripple technique as buttons (components/ui/ripple.ts), scaled
// up to wash across the full-screen menu surface.
const RIPPLE_MENU_OPEN = { strength: 28, duration: 850 };
const RIPPLE_MENU_CLOSE = { strength: 20, duration: 450 };

// Smaller, quicker ripple on the nav link itself, under the cursor.
const RIPPLE_LINK = { strength: 14, size: 160, duration: 500 };

export function MenuOverlay({ isOpen, onClose, originRef }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLAnchorElement[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const lenis = useLenis();
  const router = useTransitionRouter();
  const pathname = usePathname();

  // Set by a nav link's click — the close animation's onComplete navigates
  // here once the menu has fully exited, so the route transition starts
  // against a clean (menu-free) screenshot instead of one with the overlay
  // still on top.
  const pendingHrefRef = useRef<string | null>(null);

  // ── Fade + settle animation ───────────────────────────────────────────────
  //
  // The overlay fades in while easing from a slightly enlarged, blurred state
  // down to its resting size/sharpness — like glass settling into place.
  // Close reverses this, faster.

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (tlRef.current) tlRef.current.kill();

    // Re-baseline scroll to enabled before deciding whether to re-lock it.
    // Without this, killing an in-flight close animation (e.g. the menu is
    // toggled open→closed→open in quick succession) skips the close
    // timeline's onComplete — which is the only other place that calls
    // lenis.start() — leaving scrolling permanently stopped.
    lenis?.start();

    // Reduced motion (OS setting or the in-app Motion toggle, see
    // lib/motion-pref.ts) collapses every tween below to near-zero duration
    // instead of skipping the timeline outright — end states (opacity,
    // scale, blur, pointer-events) still need to land correctly, just
    // without the animated transition between them.
    const reduced = prefersReducedMotion();
    const d = (seconds: number) => (reduced ? 0.01 : seconds);

    if (isOpen) {
      lenis?.stop();

      // A reopen mid-close (e.g. toggled again before a link's close
      // finished) should cancel any pending nav-link navigation.
      pendingHrefRef.current = null;

      const tl = gsap.timeline();
      tlRef.current = tl;

      gsap.set(overlay, {
        opacity: 0,
        scale: 1.03,
        pointerEvents: "auto",
      });
      gsap.set(surfaceRef.current, { filter: "blur(12px)" });
      gsap.set([...linksRef.current, bottomRef.current], { opacity: 0, y: 8 });

      tl.to(overlay, {
        opacity: 1,
        scale: 1,
        duration: d(0.6),
        ease: "power3.out",
      });

      tl.to(
        surfaceRef.current,
        {
          filter: "blur(0px)",
          duration: d(0.6),
          ease: "power3.out",
        },
        "<",
      );

      // Links stagger in as the overlay is still settling
      tl.to(
        linksRef.current,
        {
          opacity: 1,
          y: 0,
          duration: d(0.5),
          ease: "power3.out",
          stagger: reduced ? 0 : 0.09,
        },
        reduced ? "<" : "-=0.4",
      );

      tl.to(
        bottomRef.current,
        {
          opacity: 1,
          y: 0,
          duration: d(0.4),
          ease: "power2.out",
        },
        reduced ? "<" : "-=0.3",
      );

      // Ripple the whole pane — background, blur, and content together —
      // from the toggle button's click point. triggerRipple already
      // no-ops under reduced motion, but skip the call entirely so it
      // doesn't even queue a single frame.
      if (!reduced) {
        const { x, y } = originRef.current;
        triggerRipple(overlay, { clientX: x, clientY: y }, RIPPLE_MENU_OPEN);
      }
    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          // Restore pointer-events: none so the hidden overlay isn't clickable
          gsap.set(overlay, { pointerEvents: "none" });
          lenis?.start();

          // mailto/external links wait for the menu to fully exit before
          // leaving the SPA. Internal routes navigate immediately on click
          // (see onClick below) — the still-opaque overlay covers the page
          // swap, so it's never visible underneath as the menu closes.
          const href = pendingHrefRef.current;
          pendingHrefRef.current = null;
          if (href) {
            window.location.href = href;
          }
        },
      });
      tlRef.current = tl;

      // Content exits first, quickly
      tl.to([...linksRef.current, bottomRef.current], {
        opacity: 0,
        y: -8,
        duration: d(0.15),
        ease: "power2.in",
        stagger: reduced ? 0 : { each: 0.04, from: "end" },
      });

      tl.to(
        overlay,
        {
          opacity: 0,
          scale: 1.02,
          duration: d(0.4),
          ease: "power2.in",
        },
        reduced ? "<" : "-=0.05",
      );

      tl.to(
        surfaceRef.current,
        {
          filter: "blur(8px)",
          duration: d(0.4),
          ease: "power2.in",
        },
        "<",
      );

      if (!reduced) {
        const { x, y } = originRef.current;
        triggerRipple(overlay, { clientX: x, clientY: y }, RIPPLE_MENU_CLOSE);
      }
    }
  }, [isOpen, lenis, originRef]);

  // ── Focus management ────────────────────────────────────────────────────
  //
  // On open: move focus to the first nav link and trap Tab/Shift+Tab within
  // the overlay's focusable elements (links + theme toggle). The Topbar's
  // toggle button handles closing (click or Escape) and isn't part of this
  // trap, keeping a single, predictable close path.

  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    linksRef.current[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = overlay.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={overlayRef}
      id="site-menu"
      className="menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      inert={!isOpen}
    >
      <div ref={surfaceRef} className="menu-overlay__surface">
        {/* Header band — aligned to the same row the fixed Topbar's
            wordmark/close occupy above it (see .menu-overlay__header). */}
        <div className="menu-overlay__header">
          <nav className="menu-overlay__nav" aria-label="Primary navigation">
            {NAV_LINKS.map(({ label, href }, i) => (
              <Link
                key={label}
                href={href}
                className="menu-overlay__link"
                ref={(el) => {
                  if (el) linksRef.current[i] = el;
                }}
                onClick={(e) => {
                  e.preventDefault();

                  // Ripple on the link itself, plus the surface-wide close
                  // ripple radiating from the same point.
                  if (!prefersReducedMotion()) {
                    triggerRipple(e.currentTarget, e, RIPPLE_LINK);
                  }
                  originRef.current = { x: e.clientX, y: e.clientY };

                  if (href.startsWith("mailto:") || href.startsWith("http")) {
                    // Wait for the close animation to finish before leaving
                    // the SPA — see pendingHrefRef and onComplete above.
                    pendingHrefRef.current = href;
                  } else if (href !== pathname) {
                    // Navigate immediately — the still-opaque overlay covers
                    // the page swap as it plays its own close animation, so
                    // the old page is never revealed underneath.
                    router.push(href);
                  }
                  // else: already on this page — just close the menu, no
                  // route transition/fade for a same-page "navigation".
                  onClose();
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Reserved for the case-study filmstrip/preview — empty for now. */}
        <div className="menu-overlay__content" aria-hidden="true" />

        {/* Bottom row — settings (theme/motion) + social links */}
        <div ref={bottomRef} className="menu-overlay__bottom">
          <div className="menu-overlay__settings">
            <span className="menu-overlay__settings-label">
              <Icon name="settings" size={14} />
              Settings
            </span>
            <ThemeToggle />
            <MotionToggle />
          </div>
          <div className="menu-overlay__actions">
            <Button
              variant="ghost"
              iconOnly="github"
              aria-label="GitHub"
              href={siteConfig.links.github}
              onClick={onClose}
            />
            <Button
              variant="ghost"
              iconOnly="linkedin"
              aria-label="LinkedIn"
              href={siteConfig.links.linkedin}
              onClick={onClose}
            />
            <EmailButton variant="ghost" iconOnly="mail" aria-label="Email" />
          </div>
        </div>
      </div>
    </div>
  );
}
