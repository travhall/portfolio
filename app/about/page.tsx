import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { EmailButton } from "@/components/ui/EmailButton";
import { Tag } from "@/components/ui/Tag";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About — Travis Hall",
  description:
    "Travis Hall — senior UX designer, front-end developer, educator. MFA in Interactive Media. Two decades at the intersection of design and engineering.",
};

export default function AboutPage() {
  return (
    <>
      <main>
        {/* ── About hero: portrait + bio ─────────────────────────────────
            The .about-portrait gets view-transition-name: hero-image (via CSS)
            so the browser morphs it from/to the home hero image on navigation. */}
        <section className="about-hero">
          {/* Portrait — 4:5 aspect ratio, same proportion as project cards.
              The view-transition-name is set in CSS on .about-portrait.       */}
          <div className="about-portrait">
            <Image
              src="/images/about-img.jpg"
              alt="Travis Hall"
              fill
              sizes="(max-width: 1080px) 100vw, 360px"
              style={{ objectFit: "cover", objectPosition: "center top" }}
              priority
            />
          </div>

          {/* Bio column */}
          <div className="about-content" style={{ paddingTop: "8px" }}>
            <h1 className="type-h1 text-ink about-title">
              Hi, I&apos;m Travis &amp; I make things people use.
            </h1>

            <div className="about-bio">
              <p className="type-lead text-ink about-bio__measure">
                I hold an MFA in Interactive Media and have spent nearly two
                decades at the intersection of design and engineering — teaching
                it at art school, building it at agencies, and scaling it across
                eCommerce platforms used by millions of engineers worldwide.
              </p>
              <p className="type-body text-ink-muted about-bio__measure">
                I&apos;ve built design systems, led UX teams, taught front-end
                development at the post-secondary level, and shipped the code
                myself. The work in this portfolio is the through-line.
              </p>
            </div>

            <div className="about-actions">
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
              <EmailButton variant="ghost" iconOnly="mail" aria-label="Email" />
              <Button
                variant="ghost"
                icon="download"
                iconPos="right"
                href={siteConfig.cv}
              >
                Download my CV
              </Button>
            </div>
          </div>
        </section>

        {/* ── Skills & Experience ─────────────────────────────────────────── */}
        <section className="about-grid">
          <div>
            <h2 className="type-h2 text-ink">Skills &amp; Expertise</h2>

            <div className="about-skill-groups">
              {SKILL_GROUPS.map(({ label, items }) => (
                <div key={label}>
                  <p className="type-eyebrow text-ink-faint about-skill-groups__label">
                    {label}
                  </p>
                  <div className="about-skill-groups__tags">
                    {items.map((s) => (
                      <Tag key={s} variant="ghost">
                        {s}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="type-h2 text-ink">Experience</h2>
            <div className="about-roles">
              {ROLES.map(({ title, org, period, body }) => (
                <div key={title}>
                  <h3 className="type-h3 text-ink">{title}</h3>
                  <p className="type-eyebrow text-water about-roles__meta">
                    {org} &bull; {period}
                  </p>
                  <p className="type-body text-ink-muted about-roles__body">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer CTA ──────────────────────────────────────────────────── */}
        <div className="about-cta">
          <p className="type-lead text-ink-muted">
            If you&apos;ve made it this far, the work is probably worth a look.
          </p>
          <Button variant="solid" icon="arrow-right" iconPos="right" href="/">
            View my work
          </Button>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="about-footer">
          <span className="type-small text-ink-faint">
            © 2026 Travis Hall. All rights reserved.
          </span>
          <div className="about-footer__social">
            <Button
              variant="glass"
              iconOnly="github"
              aria-label="GitHub"
              href={siteConfig.links.github}
              size="sm"
            />
            <Button
              variant="glass"
              iconOnly="linkedin"
              aria-label="LinkedIn"
              href={siteConfig.links.linkedin}
              size="sm"
            />
            <EmailButton variant="glass" icon="mail" iconPos="right" size="sm">
              {siteConfig.email}
            </EmailButton>
          </div>
        </footer>
      </main>
    </>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SKILL_GROUPS = [
  {
    label: "Skills",
    items: [
      "Design Systems",
      "User Experience Design",
      "User Interface Development",
      "Wireframing & Prototyping",
      "User Research & Usability Testing",
      "Information Architecture",
      "Design Sprints",
      "Product Strategy",
      "Agile Development Methodology",
      "Design Leadership",
      "Teaching",
    ],
  },
  {
    label: "Tools",
    items: [
      "Figma & FigJam",
      "VS Code",
      "Command Line",
      "Atlassian Suite",
      "Adobe Creative Suite",
      "Sketch",
      "GitHub & Bitbucket",
    ],
  },
  {
    label: "Technologies",
    items: [
      "HTML / CSS / JavaScript",
      "TypeScript",
      "React & Next.js",
      "Vue & Nuxt",
      "Node.js",
      "Tailwind CSS",
      "GraphQL & Apollo",
      "Shopify & Square",
      "WordPress & Strapi",
    ],
  },
];

const ROLES = [
  {
    title: "Senior Design Manager, UX Design Lead",
    org: "Arrow Digital · Arrow Electronics, Inc.",
    period: "January 2016 – Present",
    body: "Leading UX across Arrow's eCommerce platforms — a suite serving millions of engineers globally. Established the design system foundation, built and scaled the UX team, and introduced research-driven process across product and engineering orgs.",
  },
  {
    title: "Senior Front End Developer",
    org: "Ideapark (now Ingredient/WDGT)",
    period: "September 2013 – January 2015",
    body: "Front-end lead on campaigns and microsites for Target, Betty Crocker, and other national brands — responsible for production code quality, standards compliance, and cross-browser delivery across a high-volume agency pipeline.",
  },
  {
    title: "Front End Developer",
    org: "The Lacek Group",
    period: "September 2010 – February 2013",
    body: "Built responsive microsites and email campaigns for loyalty marketing programs. Delivered the agency's first responsive website, introducing the practice internally at a time when responsive design was still far from standard.",
  },
  {
    title: "Visiting Artist / Faculty",
    org: "Minneapolis College of Art and Design",
    period: "August 2008 – August 2010",
    body: "Taught digital media design and web development at both postbaccalaureate and undergraduate levels — covering digital image creation, audio/video production, and front-end technologies.",
  },
  {
    title: "Freelance Designer / Developer",
    org: "travishall.design",
    period: "May 2005 – Present",
    body: "Independent practice spanning art direction, branding, wireframing, and bespoke site development. Clients have included McCann, Likeletter Projects, Morsekode, and playworkgroup.",
  },
];
