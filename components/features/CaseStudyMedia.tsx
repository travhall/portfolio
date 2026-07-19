// CaseStudyMedia — renders one CaseStudySection: a full-bleed image, or a
// 50/50 split of two slots (image, a large wordmark, or a text block, in
// either order). One flexible shape instead of a fixed component per
// combination — see lib/case-studies.ts for why.

import type { CaseStudySection, CaseStudySectionSlot } from "@/lib/case-studies";

function Slot({ slot }: { slot: CaseStudySectionSlot }) {
  switch (slot.kind) {
    case "image":
      return (
        <div className="cs-split__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.image} alt={slot.alt ?? ""} className="cs-split__img" />
        </div>
      );
    case "wordmark":
      return (
        <div className="cs-split__wordmark">
          <p className="type-display">{slot.text}</p>
        </div>
      );
    case "text":
      return (
        <div className="cs-split__text">
          {slot.eyebrow && <p className="type-eyebrow text-ink-muted">{slot.eyebrow}</p>}
          <p className="type-lead">{slot.body}</p>
        </div>
      );
  }
}

export function CaseStudyMedia({ section }: { section: CaseStudySection }) {
  if (section.type === "full-image") {
    return (
      <div className="cs-full-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={section.image} alt={section.alt ?? ""} className="cs-full-image__img" />
      </div>
    );
  }

  return (
    <div className="cs-split">
      <Slot slot={section.left} />
      <Slot slot={section.right} />
    </div>
  );
}
