"use client";

/**
 * SiteFooter — global footer rendered once in the root layout, beneath
 * every page's content.
 *
 * Mirrors the Topbar's nav-aware click handling: clicking the link for the
 * page you're already on skips the route transition and instead smooth-
 * scrolls back to the top, which is the useful action at the bottom of a
 * long page. cSpell:ignore topbar
 */

import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/ui/EmailButton";
import { siteConfig } from "@/lib/site-config";
import type { CaseStudy } from "@/lib/case-studies";
import { resolveThemeVars } from "@/lib/case-study-theme";
import { prefersReducedMotion } from "@/components/ui/ripple";
import { registerExitObserver } from "@/lib/page-exit";

// caseStudies comes in as a prop, not an import — this is a client
// component (usePathname), and the data now lives behind a server-only
// filesystem read (see lib/case-studies.ts's getCaseStudies). The root
// layout loads it once and passes it down.
export function SiteFooter({ caseStudies }: { caseStudies: CaseStudy[] }) {
  const year = new Date().getFullYear();

  // The footer is a sibling of the case-study page's themed <main> (see
  // app/layout.tsx), not a descendant, so it can't inherit --cs-border
  // through the DOM the way .header-spacer does. Resolve the current
  // route's case study here instead and set just that one property —
  // deliberately not the rest of the theme (bg/fg/accent) — so the border
  // reads correctly against a themed page while the footer's own links,
  // icons, and text stay in the site's own voice, as before.
  const pathname = usePathname();
  const slug = pathname?.startsWith("/work/")
    ? pathname.slice("/work/".length)
    : undefined;
  const study = slug
    ? caseStudies.find((s) => s.slug === slug && !s.comingSoon)
    : undefined;
  const csBorder = resolveThemeVars(study?.theme)?.["--cs-border"];

  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    return registerExitObserver(() => {
      if (prefersReducedMotion() || !footerRef.current) return;
      gsap.to(footerRef.current, {
        opacity: 0,
        y: 14,
        ease: "power2.in",
        duration: 0.35,
      });
    });
  }, []);

  // Resets the exit fade above on every new page arrival — SiteFooter is a
  // persistent root-layout singleton (never unmounts/remounts across
  // client-side navigation, unlike CaseStudyBody/CaseStudyBackHome, which
  // are inside <main> and get a fresh mount on every page). Without this,
  // once the fade-out tween above runs once, the footer stays invisible
  // for the rest of the client-side session — there's no natural "new
  // page mounted" moment to undo it, the way there is for the page-scoped
  // exit participants. useLayoutEffect (not useEffect) so this resolves
  // synchronously before paint, avoiding a visible "pops back in a beat
  // late" flash on the arriving page. clearProps (not an explicit
  // opacity:1/y:0 tween) removes the inline styles GSAP set entirely,
  // falling back to the CSS default — matching the clearProps idiom
  // already used elsewhere in this codebase (e.g. Topbar.tsx's toggle
  // button) rather than leaving stray inline styles in place. Safe to run
  // unconditionally on every pathname change, including the very first
  // mount and any navigation that never triggered a fade at all —
  // clearing already-absent inline styles is a harmless no-op.
  useLayoutEffect(() => {
    if (!footerRef.current) return;
    gsap.set(footerRef.current, { clearProps: "opacity,transform" });
  }, [pathname]);

  return (
    <footer
      ref={footerRef}
      className="site-footer"
      style={
        csBorder ? ({ "--cs-border": csBorder } as CSSProperties) : undefined
      }
    >
      <div className="site-footer__social">
        <Button
          variant="glass"
          iconOnly="github"
          aria-label="GitHub"
          href={siteConfig.links.github}
        />
        <Button
          variant="glass"
          iconOnly="linkedin"
          aria-label="LinkedIn"
          href={siteConfig.links.linkedin}
        />
        <EmailButton variant="glass" icon="mail" iconPos="right">
          {siteConfig.email}
        </EmailButton>
      </div>

      <span className="type-small text-ink-faint">
        © {year} {siteConfig.name}. All rights reserved.
      </span>
    </footer>
  );
}
