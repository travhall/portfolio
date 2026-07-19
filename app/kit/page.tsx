import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Icon, ICON_NAMES } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MotionToggle } from "@/components/ui/MotionToggle";
import { ContrastSwatch } from "./ContrastSwatch";
import { caseStudies } from "@/lib/case-studies";
import { resolveThemeVars } from "@/lib/case-study-theme";
import "./kit.css";

// /kit — internal style guide. Unlinked: not in nav, not in sitemap.
// Living source of truth for the design system — every token and component
// shown here is the *real* one the site uses, not a parallel reference copy.
export const metadata = {
  title: "Style guide · internal",
  robots: { index: false, follow: false },
};

const SWATCH_GROUPS = [
  {
    name: "Paper & ink",
    note: "brand-3 · sage-neutral — the airy base register",
    tokens: ["surface", "surface-dim", "ink-faint", "ink-muted", "ink", "line", "hairline", "border-control"],
  },
  {
    name: "Water & glass",
    note: "brand-1 · blue-teal — the buoyant / submerged accent",
    tokens: ["glass-tint", "water", "water-deep"],
  },
  {
    name: "Chemical",
    note: "brand-2 · amber — the contrasting, technical-intrusion accent",
    tokens: ["chemical-warm", "chemical"],
  },
];

// Raw underlying ramps — what the semantic tokens above alias into. Useful
// for picking new accents without drifting off-palette.
const BRAND_RAMPS = [
  { name: "brand-1", note: "blue-teal · water & glass" },
  { name: "brand-2", note: "amber · chemical" },
  { name: "brand-3", note: "sage-neutral · paper & ink" },
];
const RAMP_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Text/background pairings as they're actually used across the site — the
// living accessibility audit. Each renders with the real type + color
// utility classes, then measures live WCAG contrast (updates with the
// theme toggle above).
const COLOR_PAIRINGS = [
  {
    fgVar: "--ink",
    bgVar: "--surface",
    sample: "Creating thoughtful experiences",
    sampleClassName: "type-body",
    context: "Default body copy — .text-ink on --surface",
  },
  {
    fgVar: "--ink-muted",
    bgVar: "--surface",
    sample: "Captions, eyebrow notes, secondary copy",
    sampleClassName: "type-small",
    context: "Secondary copy — .text-ink-muted on --surface",
  },
  {
    fgVar: "--ink-faint",
    bgVar: "--surface",
    sample: "Projects loading…",
    sampleClassName: "type-eyebrow",
    context: "Faint labels — .text-ink-faint on --surface (brand-3-500, decorative only)",
  },
  {
    fgVar: "--water",
    bgVar: "--surface",
    sample: "Hover / active link accent",
    sampleClassName: "type-body",
    context: "Accent — .text-water on --surface (brand-1-700)",
  },
  {
    fgVar: "--water-deep",
    bgVar: "--surface",
    sample: "Glass button label",
    sampleClassName: "type-small",
    context: "btn--glass / Tag glass — --water-deep on --surface",
  },
  {
    fgVar: "--surface",
    bgVar: "--ink",
    sample: "Solid button label",
    sampleClassName: "type-small",
    context: "btn--solid — --surface on --ink (inverted)",
  },
];

// Every case study's real theme, run through the exact same contrast check
// as the fixed design-system pairings above — the accessibility audit for
// content data (one-off per-project colors), not just tokens. Adding a new
// case study or changing a theme surfaces a pass/fail here automatically;
// there's no separate process to remember. See lib/case-study-theme.ts for
// why this isn't called "brand." AAA is dropped here (see showAAA below) —
// 7:1 isn't a realistic bar for text on a saturated background and every
// pairing failing it read as noise; AA is the actual gate.
//
// Headline uses each project's own --cs-fg; the eyebrow uses --cs-accent-text
// — the project's real brand color, recolored to hold up as text (not the
// raw --cs-accent used for the dot/button-hover, which is frequently unsafe
// as text — see case-studies.ts). See the .cs-hero-eyebrow/.cs-hero-headline
// rules in layout.css. These pairings audit what actually renders.
const CASE_STUDY_ACCENT_PAIRINGS = caseStudies
  .filter((study) => study.theme)
  .flatMap((study) => {
    const vars = resolveThemeVars(study.theme)!;
    return [
      {
        fgVar: vars["--cs-fg"],
        bgVar: vars["--cs-bg"],
        bgLabel: `${study.headline} background`,
        sample: study.headline,
        sampleClassName: "type-h3",
        context: `Case-study headline — --cs-fg on ${study.slug}'s background`,
        showAAA: false,
      },
      {
        fgVar: vars["--cs-accent-text"],
        bgVar: vars["--cs-bg"],
        bgLabel: `${study.headline} background`,
        sample: study.eyebrow,
        sampleClassName: "type-eyebrow",
        context: `Case-study eyebrow — --cs-accent-text on ${study.slug}'s background`,
        showAAA: false,
      },
    ];
  });

const TYPE_ROWS = [
  { cls: "type-display",   label: "Display",   token: "--text-display · light 300" },
  { cls: "type-h1",        label: "Heading 1", token: "--text-h1 · light 300" },
  { cls: "type-h2",        label: "Heading 2", token: "--text-h2 · regular 400" },
  { cls: "type-h3",        label: "Heading 3", token: "--text-h3 · medium 500" },
  { cls: "type-statement", label: "Statement", token: "--text-statement · regular 400" },
  { cls: "type-lead",      label: "Lead",      token: "--text-lead · regular 400" },
  { cls: "type-body",      label: "Body",      token: "--text-body · regular 400" },
  { cls: "type-small",     label: "Small",     token: "--text-small · regular 400" },
  { cls: "type-caption",   label: "Caption",   token: "--text-caption · medium 500" },
  { cls: "type-eyebrow",   label: "Eyebrow",   token: "--text-eyebrow · medium 500, uppercase" },
  { cls: "type-micro",     label: "Micro",     token: "--text-micro · medium 500" },
];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="kit-section">
      <div className="kit-section__head">
        <h2 className="type-h2 text-ink">{title}</h2>
        {note ? <p className="type-caption text-ink-muted kit-section__note">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function KitPage() {
  return (
    <main className="kit-page">
      <header className="kit-header">
        <div className="kit-header__row">
          <div>
            <p className="type-eyebrow text-ink-muted">Internal · unlinked</p>
            <h1 className="type-display text-ink kit-header__title">Style guide</h1>
          </div>
          <div className="kit-row kit-row--tight">
            <ThemeToggle />
            <MotionToggle />
          </div>
        </div>
        <p className="type-lead text-ink-muted kit-header__lead">
          The living source of truth for the portfolio&apos;s design system — tokens and
          components as they actually exist in the codebase. Not part of the public site.
          Use the toggles above to audit every pairing in both light and dark, and to
          preview the reduced-motion state.
        </p>
      </header>

      <Section
        title="Color"
        note="Three palettes, three roles: paper/ink neutrals, water/glass accents, chemical contrast — all OKLCH."
      >
        <div className="kit-color-groups">
          {SWATCH_GROUPS.map((group) => (
            <div key={group.name}>
              <p className="type-h3 text-ink">{group.name}</p>
              <p className="type-caption text-ink-muted kit-color-group__note">{group.note}</p>
              <div className="kit-swatches">
                {group.tokens.map((token) => (
                  <div key={token} className="kit-swatch">
                    <div
                      className="kit-swatch__color"
                      style={{ background: `var(--${token})` }}
                    />
                    <span className="type-mono text-ink-muted">--{token}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Brand ramps"
        note="The raw 50–950 ramps the semantic tokens above alias into — for picking new accents without drifting off-palette."
      >
        <div className="kit-color-groups">
          {BRAND_RAMPS.map((ramp) => (
            <div key={ramp.name}>
              <p className="type-h3 text-ink">{ramp.name}</p>
              <p className="type-caption text-ink-muted kit-color-group__note">{ramp.note}</p>
              <div className="kit-ramp">
                {RAMP_STEPS.map((step) => (
                  <div key={step} className="kit-ramp__swatch">
                    <div
                      className="kit-swatch__color"
                      style={{ background: `var(--color-${ramp.name}-${step})` }}
                    />
                    <span className="type-mono text-ink-muted">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Color in context"
        note="Every text/background pairing the system actually renders, with a live WCAG contrast measurement — toggle the theme above to audit both modes."
      >
        <div className="kit-pairings">
          {COLOR_PAIRINGS.map((pairing) => (
            <ContrastSwatch key={`${pairing.fgVar}-on-${pairing.bgVar}-${pairing.context}`} {...pairing} />
          ))}
        </div>
      </Section>

      <Section
        title="Case study themes"
        note="Each project's real bg/fg (content data, not a design-system token) audited the same way as everything above — see lib/case-study-theme.ts."
      >
        <div className="kit-pairings">
          {CASE_STUDY_ACCENT_PAIRINGS.map((pairing) => (
            <ContrastSwatch key={pairing.context} {...pairing} />
          ))}
        </div>
      </Section>

      <Section title="Type" note="Manrope — the only sans in the system. Light/regular for editorial calm, medium for UI and labels.">
        <div className="kit-type-rows">
          {TYPE_ROWS.map((row) => (
            <div key={row.cls} className="kit-type-row">
              <p className={`${row.cls} text-ink kit-type-row__sample`}>Creating thoughtful experiences</p>
              <div className="kit-type-row__meta">
                <span className="type-small text-ink kit-type-row__label">{row.label}</span>
                <span className="type-mono text-ink-muted">{row.token}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Glass surface"
        note="The water/glass register made tactile — frosted, refractive, edge-lit. .btn--glass and the glass Tag both set color: var(--water-deep), so they're only audited where the glass system actually appears."
      >
        <div className="kit-glass-grid">
          <div className="kit-glass-demo">
            <div className="kit-glass-demo__backdrop kit-glass-demo__backdrop--photo">
              <div className="glass-surface kit-glass-demo__card">
                <Button variant="glass">Glass button</Button>
                <Tag>Glass tag</Tag>
              </div>
            </div>
            <p className="type-small text-ink-muted kit-glass-demo__caption">
              Over imagery — fixed brand-1 gradient (doesn&apos;t flip with theme), the frost +
              sheen + blur read as glass over a photo.
            </p>
          </div>
          <div className="kit-glass-demo">
            <div className="kit-glass-demo__backdrop kit-glass-demo__backdrop--paper">
              <div className="glass-surface kit-glass-demo__card">
                <Button variant="glass">Glass button</Button>
                <Tag>Glass tag</Tag>
              </div>
            </div>
            <p className="type-small text-ink-muted kit-glass-demo__caption">
              Over paper — the Topbar / MenuOverlay context: --water-deep on --glass-fill over
              --surface-dim.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="kit-stack">
          <div className="kit-row">
            <Button variant="solid">Solid</Button>
            <Button variant="glass">Glass</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link" icon="arrow-right" iconPos="right">Link</Button>
          </div>
          <div className="kit-row">
            <Button variant="solid" icon="download" iconPos="right">Download CV</Button>
            <Button variant="ghost" icon="arrow-up-right" iconPos="right">Case study</Button>
            <Button variant="glass" iconOnly="github" aria-label="GitHub" />
            <Button variant="solid" size="sm">Small</Button>
            <Button variant="solid" size="lg">Large</Button>
          </div>
        </div>
      </Section>

      <Section title="Tags">
        <div className="kit-row kit-row--tight">
          <Tag>React</Tag>
          <Tag variant="solid">New</Tag>
          <Tag variant="ghost" icon="sparkle">Featured</Tag>
          <Tag dismissible>Dismissible</Tag>
        </div>
      </Section>

      <Section title="Icons" note={`${ICON_NAMES.length} line icons · 1.6px stroke · 24px grid · currentColor`}>
        <div className="kit-icons">
          {ICON_NAMES.map((name) => (
            <div key={name} className="kit-icon-card">
              <Icon name={name} size={20} className="text-ink" />
              <span className="type-micro text-ink-muted">{name}</span>
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
