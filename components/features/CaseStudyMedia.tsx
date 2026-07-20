// CaseStudyMedia — renders one CaseStudySection: a full-bleed image, a
// centered full-width text block, or a 50/50 split of two slots (an image
// or a text block, in either order). One flexible shape instead of a fixed
// component per combination — see lib/case-studies.ts for why.

import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import type { CaseStudySection, CaseStudySectionSlot, CaseStudyTextBlock } from "@/lib/case-studies";

// Shared by the split "text" slot and the full-width "full-text" section —
// one field set, one render path, styled by whichever wrapper class
// (.cs-split__text or .cs-full-text) the caller puts around it.
function TextBlock({ block }: { block: CaseStudyTextBlock }) {
  return (
    <>
      {block.eyebrow && <p className="type-eyebrow text-ink-muted">{block.eyebrow}</p>}
      {block.heading && <p className="type-display">{block.heading}</p>}
      <ReactMarkdown components={{ p: (props) => <p className="type-lead" {...props} /> }}>
        {block.body}
      </ReactMarkdown>
      {block.cta && (
        <Button
          variant={block.cta.variant ?? "link"}
          icon={block.cta.icon}
          iconPos={block.cta.iconPos ?? "left"}
          href={block.cta.href}
          target={(block.cta.newTab ?? true) ? "_blank" : undefined}
          rel={(block.cta.newTab ?? true) ? "noopener noreferrer" : undefined}
        >
          {block.cta.label}
        </Button>
      )}
    </>
  );
}

function Slot({ slot }: { slot: CaseStudySectionSlot }) {
  switch (slot.kind) {
    case "image":
      return (
        <div className="cs-split__media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={slot.image} alt={slot.alt ?? ""} className="cs-split__img" />
        </div>
      );
    case "text":
      return (
        <div className="cs-split__text">
          <TextBlock block={slot} />
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

  if (section.type === "full-text") {
    return (
      <div className="cs-full-text">
        <TextBlock block={section} />
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
