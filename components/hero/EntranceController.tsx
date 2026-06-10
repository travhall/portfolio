'use client';

/**
 * EntranceController — one-time page-load entrance animation.
 *
 * Finds every `.will-enter` element and runs a staggered GSAP timeline that
 * transitions them from a dissolved/blurred state into their crisp form —
 * the "ink in water, reversed" concept: elements start distorted and develop.
 *
 * Fires only on the first page the user lands on (sessionStorage flag).
 * Subsequent navigations handled by View Transitions API instead.
 *
 * CSS `.will-enter` sets the starting state:
 *   opacity: 0; filter: blur(14px) saturate(0.2); transform: translateY(6px);
 */

import { useEffect } from 'react';
import { gsap } from 'gsap';

export function EntranceController() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.will-enter');

    // On repeat visits within the same session, skip the animation but still
    // make elements immediately visible — they'd stay at opacity:0 otherwise.
    if (sessionStorage.getItem('entrance-done')) {
      elements.forEach(el => el.classList.remove('will-enter'));
      return;
    }
    if (!elements.length) return;

    // Respect prefers-reduced-motion — a crisp fade is still a valid entrance
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tl = gsap.timeline({
      delay: 0.1,
      onComplete: () => sessionStorage.setItem('entrance-done', '1'),
    });

    tl.to(elements, {
      opacity:    1,
      filter:     reduce ? 'blur(0px) saturate(1)' : 'blur(0px) saturate(1)',
      y:          0,
      duration:   reduce ? 0.3 : 1.1,
      ease:       'power3.out',
      stagger:    reduce ? 0 : 0.18,
      clearProps: 'filter,transform',   // let CSS take over after animation
    });

    return () => { tl.kill(); };
  }, []);

  // Renders nothing — pure side-effect component
  return null;
}
