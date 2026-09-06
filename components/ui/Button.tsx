"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { triggerRipple } from "./ripple";

// One reusable button, every variant the system needs.
//
//   <Button>Label</Button>                              solid (primary)
//   <Button variant="glass">Menu</Button>               frosted glass
//   <Button variant="ghost">Secondary</Button>          hairline outline
//   <Button variant="link" icon="arrow-right">Read</Button>
//   <Button icon="download" iconPos="right">CV</Button> with an icon
//   <Button iconOnly="plus" aria-label="Add" />         icon-only (any surface)
//   <Button size="sm" | "lg">…</Button>                 sizes
//   <Button href="…">…</Button>                         renders an <a>
//
// Trailing arrows / downloads get a motion cue on hover automatically.
// Click sends a subtle water-ripple out from the cursor point.
export const RIPPLE_SUBTLE = { strength: 12, size: 180, duration: 750 };

type Variant = "solid" | "glass" | "ghost" | "link";
type Size = "sm" | "lg";
type Nudge = "r" | "d" | "diag" | "spin" | "none";

type CommonProps = {
  children?: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconPos?: "left" | "right";
  iconOnly?: IconName;
  className?: string;
  nudge?: Nudge;
  /** water-ripple on click — off automatically for the link variant */
  ripple?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
};

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "type"> & { href?: undefined };

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string };

export type Props = ButtonProps | AnchorProps;

// pick a sensible motion cue from the icon if not told otherwise
function cueFor(name: IconName | undefined, nudge: Nudge | undefined): Exclude<Nudge, "none"> | null {
  if (nudge) return nudge === "none" ? null : nudge;
  if (!name) return null;
  if (name === "arrow-right") return "r";
  if (name === "download" || name === "arrow-down") return "d";
  if (name === "arrow-up-right" || name === "external") return "diag";
  if (name === "plus" || name === "x") return "spin";
  return null;
}

const CUE_CLASS: Record<Exclude<Nudge, "none">, string> = {
  r: "nudge-r",
  d: "nudge-d",
  diag: "diag",
  spin: "spin",
};

export function Button({
  children,
  variant = "solid",
  size,
  icon,
  iconPos = "left",
  iconOnly,
  href,
  className = "",
  nudge,
  ripple = true,
  onClick,
  ...rest
}: Props) {
  const isGlass = variant === "glass";
  const cls = [
    "btn",
    `btn--${variant}`,
    isGlass ? "glass-surface" : "",
    size ? `btn--${size}` : "",
    iconOnly ? "btn--icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const glyphClass = (name: IconName | undefined) => {
    const cue = cueFor(name, nudge);
    return cue ? ` btn__icon--${CUE_CLASS[cue]}` : "";
  };

  const renderGlyph = (name: IconName | undefined) =>
    name ? (
      <span className={`btn__icon${glyphClass(name)}`}>
        <Icon name={name} />
      </span>
    ) : null;

  const rippleOn = ripple && variant !== "link";
  const handleClick = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (rippleOn) triggerRipple(e.currentTarget, e, RIPPLE_SUBTLE);
    onClick?.(e);
  };

  const content = iconOnly ? (
    renderGlyph(iconOnly)
  ) : (
    <>
      {iconPos === "left" && renderGlyph(icon)}
      <span className="btn__label">{children}</span>
      {iconPos === "right" && renderGlyph(icon)}
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls} onClick={handleClick} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={handleClick} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  );
}
