import { AboutPortrait } from "@/components/about/AboutPortrait";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "About",
  description:
    "Travis Hall — senior UX designer, front-end developer, educator. MFA in Interactive Media. Two decades at the intersection of design and engineering.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main id="main-content">
      <div className="header-spacer" aria-hidden="true" />

      <section className="about-body">
        {/* Left column — sticky portrait */}
        <div className="about-rail">
          <AboutPortrait />
        </div>

        {/* Centre column */}
        <div className="about-content">
          <div className="about-bio">
            <h1 className="type-h1 text-ink">
              Hi, I&apos;m Travis &amp; I make things people use.
            </h1>

            <p className="type-lead text-ink">
              Two decades in, still doing both — design and code, depending on
              what the problem needs. Agencies, art school, and a global
              eCommerce platform along the way. MFA, if that matters to you.
            </p>
            <p className="type-body text-ink-muted">
              The short version: I&apos;ve built the systems, led the teams, and
              written the production code. Sometimes all three on the same
              project.
            </p>
          </div>

          <div className="about-details">
            <div className="about-experience">
              {/* type-h3 for section labels — they're navigational, not page titles */}
              <h2 className="type-h3 text-ink about-section-heading">
                Experience
              </h2>
              <div className="about-roles">
                {ROLES.map(({ title, org, period, body }) => (
                  <div key={title}>
                    {/* type-statement for role titles — sits between h3 and lead,
                        regular weight keeps the résumé register light cSpell:ignore résumé Cann */}
                    <h3 className="type-statement text-ink">{title}</h3>
                    <p className="type-eyebrow text-water about-role__meta">
                      {org} &bull; {period}
                    </p>
                    <p className="type-body text-ink-muted about-role__body">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="about-skills">
              <h2 className="type-h3 text-ink about-section-heading">
                Skills &amp; Expertise
              </h2>
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
          </div>
        </div>
      </section>

      {/* CTA — full width, outside about-body */}
      <div className="about-cta">
        <div className="about-cta__inner">
          <p className="type-lead text-ink-muted">
            If you&apos;ve made it this far, the work is probably worth a look.
          </p>
          <Button variant="solid" icon="arrow-right" iconPos="right" href="/">
            View my work
          </Button>
        </div>
      </div>
    </main>
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
    body: "Taught digital media design and web development at both post-baccalaureate and undergraduate levels — covering digital image creation, audio/video production, and front-end technologies.",
  },
  {
    title: "Freelance Designer / Developer",
    org: "travishall.design",
    period: "May 2005 – Present",
    body: "Independent practice spanning art direction, branding, wireframing, and bespoke site development. Clients have included McCann, Likeletter Projects, Morsekode, and playworkgroup.",
  },
];

// cSpell:ignore WDGT Likeletter Morsekode playworkgroup
