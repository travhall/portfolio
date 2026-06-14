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

import { usePathname } from "next/navigation";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/ui/EmailButton";
import { useLenis } from "@/components/providers/SmoothScroll";
import { siteConfig } from "@/lib/site-config";

// const FOOTER_LINKS = [
//   { label: "Work", href: "/" },
//   { label: "About", href: "/about" },
// ];

export function SiteFooter() {
  const pathname = usePathname();
  const lenis = useLenis();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <span className="type-small text-ink-faint">
        © {year} {siteConfig.name}. All rights reserved.
      </span>

      {/* <nav className="site-footer__nav" aria-label="Footer">
        {FOOTER_LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="site-footer__link type-small"
            onClick={(e) => {
              if (href === pathname) {
                e.preventDefault();
                lenis?.scrollTo(0, { duration: 1.2 });
              }
            }}
          >
            {label}
          </Link>
        ))}
      </nav> */}

      <div className="site-footer__social">
        <Button
          variant="ghost"
          iconOnly="github"
          aria-label="GitHub"
          href={siteConfig.links.github}
        />
        <Button
          variant="ghost"
          iconOnly="linkedin"
          aria-label="LinkedIn"
          href={siteConfig.links.linkedin}
        />
        <EmailButton variant="ghost" icon="mail" iconPos="right">
          {siteConfig.email}
        </EmailButton>
      </div>
    </footer>
  );
}
