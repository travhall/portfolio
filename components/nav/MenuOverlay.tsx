"use client";

/**
 * MenuOverlay — full-screen glass takeover with a fade + settle animation.
 *
 * Open  — The overlay fades and scales in while its content layer eases from
 *         blurred to sharp — like glass settling into place. Nav links
 *         stagger in while it's still settling. At the same time, a
 *         water-ripple (the same SVG displacement technique used on buttons)
 *         radiates across the whole pane — background, blur and all — from
 *         the toggle button's click point, as if the button's tap dropped
 *         into the glass.
 *
 * Close — Nav links exit first, then the overlay fades/blurs back out, with
 *         a quicker ripple pulse from the same origin.
 *
 * Theme toggle — cycles auto → dark → light, writes a data-theme attribute on
 *                <html> so the CSS [data-theme] overrides take effect instantly.
 *
 * Focus — the overlay is `inert` while closed (removes its links from the tab
 *         order and the a11y tree). On open, focus moves to the first nav
 *         link and Tab/Shift+Tab is trapped within the overlay's links and
 *         theme toggle. The Topbar's menu button is the only open/close
 *         control and remains visible above the overlay throughout.
 */

import { useEffect, useRef, type RefObject } from "react";
import { Link, useTransitionRouter } from "next-view-transitions";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/ui/EmailButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
  { label: "Work", href: "/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "mailto:travis@travishall.design" },
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
      gsap.set([...linksRef.current, bottomRef.current], { opacity: 0, y: 18 });

      tl.to(overlay, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
      });

      tl.to(
        surfaceRef.current,
        {
          filter: "blur(0px)",
          duration: 0.6,
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
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.09,
        },
        "-=0.4",
      );

      tl.to(
        bottomRef.current,
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        },
        "-=0.3",
      );

      // Ripple the whole pane — background, blur, and content together —
      // from the toggle button's click point.
      if (!prefersReducedMotion()) {
        const { x, y } = originRef.current;
        triggerRipple(overlay, { clientX: x, clientY: y }, RIPPLE_MENU_OPEN);
      }
    } else {
      const tl = gsap.timeline({
        onComplete: () => {
          // Restore pointer-events: none so the hidden overlay isn't clickable
          gsap.set(overlay, { pointerEvents: "none" });
          lenis?.start();

          // If a nav link triggered this close, navigate now that the menu
          // has fully exited — the route's view transition then starts
          // against a clean screenshot, with no overlay in the way.
          const href = pendingHrefRef.current;
          pendingHrefRef.current = null;
          if (href) {
            if (href.startsWith("mailto:") || href.startsWith("http")) {
              window.location.href = href;
            } else {
              router.push(href);
            }
          }
        },
      });
      tlRef.current = tl;

      // Content exits first, quickly
      tl.to([...linksRef.current, bottomRef.current], {
        opacity: 0,
        y: -8,
        duration: 0.15,
        ease: "power2.in",
        stagger: { each: 0.04, from: "end" },
      });

      tl.to(
        overlay,
        {
          opacity: 0,
          scale: 1.02,
          duration: 0.4,
          ease: "power2.in",
        },
        "-=0.05",
      );

      tl.to(
        surfaceRef.current,
        {
          filter: "blur(8px)",
          duration: 0.4,
          ease: "power2.in",
        },
        "<",
      );

      if (!prefersReducedMotion()) {
        const { x, y } = originRef.current;
        triggerRipple(overlay, { clientX: x, clientY: y }, RIPPLE_MENU_CLOSE);
      }
    }
  }, [isOpen, lenis]);

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
        {/* Navigation links */}
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

                // Navigate once the close animation finishes — see
                // pendingHrefRef and the close timeline's onComplete above.
                pendingHrefRef.current = href;
                onClose();
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom row — theme toggle + quick links */}
        <div ref={bottomRef} className="menu-overlay__bottom">
          <ThemeToggle />
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
            <Button
              variant="ghost"
              icon="download"
              iconPos="right"
              href={siteConfig.cv}
              onClick={onClose}
            >
              Download CV
            </Button>
            <EmailButton variant="ghost" iconOnly="mail" aria-label="Email" />
          </div>
        </div>
      </div>
    </div>
  );
}
