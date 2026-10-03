// CaseStudyMedia — renders one CaseStudySection: a full-bleed image, a
// full-width text block (a short centered "statement" or left-aligned
// long-form "story"), or a 50/50 split of two slots (an image or a text
// block, in either order). One flexible shape instead of a fixed component
// per combination — see lib/case-studies.ts for why.

import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/Button";
import type { CaseStudySection, CaseStudySectionSlot, CaseStudyTextBlock } from "@/lib/case-studies";

// Shared by the split "text" slot and the full-width "full-text" section —
// one field set, one render path. It renders two parts, head (eyebrow +
// heading) and body (markdown + CTA), and the caller's wrapper class
// (.cs-split__text, .cs-full-text, or .cs-story) decides where they sit.
// `scale` sets the heading size: "display" keeps the large display type for
// short centered statements; "title" and "label" are sized for a heading that
// sits above (or beside) running copy.
type HeadingScale = "display" | "title" | "label";
const HEADING_CLASS: Record<HeadingScale, string> = {
  display: "type-display",
  title: "type-h2",
  label: "type-h3",
};

function TextBlock({
  block,
  scale,
  parts,
}: {
  block: CaseStudyTextBlock;
  scale: HeadingScale;
  /** Optional per-part classes, for layouts that place head and body in
   *  separate grid cells (.cs-story). */
  parts?: { head?: string; body?: string };
}) {
  const hasHead = Boolean(block.eyebrow || block.heading);
  return (
    <>
      {hasHead && (
        <div className={["cs-text__head", parts?.head].filter(Boolean).join(" ")}>
          {block.eyebrow && <p className="type-eyebrow text-ink-muted">{block.eyebrow}</p>}
          {block.heading && <h2 className={HEADING_CLASS[scale]}>{block.heading}</h2>}
        </div>
      )}
      <div className={["cs-text__body", parts?.body].filter(Boolean).join(" ")}>
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
      </div>
    </>
  );
}

function Slot({ slot }: { slot: CaseStudySectionSlot }) {
  switch (slot.kind) {
    case "image":
      return (
        <div className="cs-split__media">
          <Image
            src={slot.image}
            alt={slot.alt ?? ""}
            fill
            sizes="(min-width: 900px) 50vw, 100vw"
            className="cs-split__img"
          />
        </div>
      );
    case "text":
      return (
        <div className="cs-split__text">
          <TextBlock block={slot} scale="title" />
        </div>
      );
  }
}

export function CaseStudyMedia({ section }: { section: CaseStudySection }) {
  if (section.type === "full-image") {
    return (
      <div className="cs-full-image">
        <Image
          src={section.image}
          alt={section.alt ?? ""}
          fill
          sizes="100vw"
          className="cs-full-image__img"
        />
      </div>
    );
  }

  if (section.type === "full-text") {
    if (section.layout === "story") {
      return (
        <div className={`cs-story${section.align === "end" ? " cs-story--end" : ""}`}>
          <TextBlock
            block={section}
            scale="label"
            parts={{ head: "cs-story__head", body: "cs-story__body" }}
          />
        </div>
      );
    }
    return (
      <div className="cs-full-text">
        <TextBlock block={section} scale="display" />
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
