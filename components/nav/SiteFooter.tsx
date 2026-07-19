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

import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/ui/EmailButton";
import { siteConfig } from "@/lib/site-config";
import { caseStudies } from "@/lib/case-studies";
import { resolveThemeVars } from "@/lib/case-study-theme";

export function SiteFooter() {
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

  return (
    <footer
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
