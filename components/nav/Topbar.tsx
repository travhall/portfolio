'use client';

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

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'next-view-transitions';
import { Button } from '@/components/ui/Button';
import { MenuOverlay } from './MenuOverlay';
import { prefersReducedMotion, triggerRipple } from '@/components/ui/ripple';

const RIPPLE_BRAND = { strength: 9, size: 90, duration: 600 };

export function Topbar() {
  const headerRef          = useRef<HTMLElement>(null);
  const brandRef           = useRef<HTMLAnchorElement>(null);
  const menuOriginRef      = useRef({ x: 0, y: 0 });
  const [isOpen, setIsOpen] = useState(false);

  // Wordmark fade on scroll — pinned fully visible while the menu is open
  // so it can act as the overlay's "back to top / home" anchor.
  useEffect(() => {
    const el = brandRef.current;
    if (!el) return;

    if (isOpen) {
      el.style.opacity       = '1';
      el.style.pointerEvents = 'auto';
      return;
    }

    let ticking = false;

    const update = () => {
      const y       = window.scrollY;
      const opacity = Math.max(0, 1 - y / 120);
      el.style.opacity       = String(opacity.toFixed(3));
      el.style.pointerEvents = opacity < 0.05 ? 'none' : 'auto';
      ticking = false;
    };
    update();

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isOpen]);

  // Closing always returns focus to the toggle button — whether triggered
  // by Escape, a nav link, or the toggle itself.
  const close = () => {
    setIsOpen(false);
    headerRef.current?.querySelector<HTMLButtonElement>('.topbar__toggle')?.focus();
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <>
      <header ref={headerRef} className="topbar" aria-label="Site navigation">
        <Link
          ref={brandRef}
          href="/"
          className="topbar__brand"
          onClick={(e: MouseEvent<HTMLAnchorElement>) => {
            if (!prefersReducedMotion()) triggerRipple(e.currentTarget, e, RIPPLE_BRAND);
            close();
          }}
        >
          travishall.design
        </Link>
        <Button
          variant="glass"
          size="sm"
          className="topbar__toggle"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          aria-controls="site-menu"
          onClick={(e) => {
            menuOriginRef.current = { x: e.clientX, y: e.clientY };
            setIsOpen((o) => !o);
          }}
        >
          {isOpen ? 'close' : 'menu'}
        </Button>
      </header>

      <MenuOverlay isOpen={isOpen} onClose={close} originRef={menuOriginRef} />
    </>
  );
}
