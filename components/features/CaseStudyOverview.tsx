// CaseStudyOverview — the case-study page's second section: a lead
// paragraph plus an optional Sectors/Credits/Awards meta panel. Static
// (no entrance choreography) — CaseStudyHero already carries the page's
// one big reveal moment; repeating it here would just be noise.

import { Icon } from "@/components/ui/Icon";
import type { CaseStudyOverview as CaseStudyOverviewData } from "@/lib/case-studies";

type Props = CaseStudyOverviewData;

export function CaseStudyOverview({ body, sectors, credits, awards }: Props) {
  const hasMeta = Boolean(sectors?.length) || Boolean(credits?.length) || Boolean(awards?.length);

  return (
    <div className="cs-overview">
      <div className="cs-overview__body">
        <h2 className="type-eyebrow text-ink-muted cs-overview__label">Overview</h2>
        <p className="type-lead cs-overview__text">{body}</p>
      </div>
      {hasMeta && (
        <div className="cs-overview__meta">
          {sectors && sectors.length > 0 && (
            <div className="cs-overview__group">
              <p className="type-eyebrow text-ink-muted cs-overview__label">Sectors</p>
              <ul className="cs-overview__list">
                {sectors.map((sector) => (
                  <li key={sector} className="type-body">
                    {sector}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {credits && credits.length > 0 && (
            <div className="cs-overview__group">
              <p className="type-eyebrow text-ink-muted cs-overview__label">Credits</p>
              <div className="cs-overview__credits">
                {credits.map((credit) => (
                  <div key={credit.role} className="cs-overview__credit">
                    <p className="type-caption text-ink-muted">{credit.role}</p>
                    {credit.names.map((name) => (
                      <p key={name} className="type-body">
                        {name}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {awards && awards.length > 0 && (
            <div className="cs-overview__group">
              <p className="type-eyebrow text-ink-muted cs-overview__label">Awards &amp; Recognition</p>
              <ul className="cs-overview__list">
                {awards.map((award) =>
                  award.href ? (
                    <li key={award.label}>
                      <a
                        href={award.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="type-body cs-overview__award"
                      >
                        {award.label}
                        <Icon name="external" size={14} />
                      </a>
                    </li>
                  ) : (
                    <li key={award.label} className="type-body">
                      {award.label}
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
