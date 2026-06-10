"use client";

import { useState, type HTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { disposeRipple, prefersReducedMotion, triggerRipple } from "./ripple";

const RIPPLE_DISMISS = { strength: 9, size: 90, duration: 600 };

// Compact label chip. Glass by default (shares the button's frosted material);
// solid + ghost surfaces; optional leading icon; optional dismissible × that
// animates the chip out.
//
//   <Tag>React</Tag>                                     glass (default)
//   <Tag variant="solid">New</Tag>
//   <Tag variant="ghost" icon="sparkle">Featured</Tag>
//   <Tag dismissible onDismiss={() => …}>OKLCH</Tag>

type Variant = "glass" | "solid" | "ghost";

type Props = {
  children?: ReactNode;
  variant?: Variant;
  icon?: IconName;
  dismissible?: boolean;
  onDismiss?: (value?: string) => void;
  value?: string;
  className?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children">;

export function Tag({
  children,
  variant = "glass",
  icon,
  dismissible = false,
  onDismiss,
  value,
  className = "",
  ...rest
}: Props) {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  const isGlass = variant === "glass";
  const cls = [
    "tag",
    `tag--${variant}`,
    isGlass ? "glass-surface" : "",
    dismissible ? "tag--dismiss" : "",
    leaving ? "tag--leaving" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const dismiss = (e: MouseEvent<HTMLButtonElement>) => {
    if (leaving) return;
    const btn = e.currentTarget;
    triggerRipple(btn, e, RIPPLE_DISMISS);
    setLeaving(true);
    setTimeout(() => {
      disposeRipple(btn);
      setGone(true);
      onDismiss?.(value);
    }, prefersReducedMotion() ? 10 : 260);
  };

  if (gone) return null;

  return (
    <span className={cls} {...rest}>
      {icon ? (
        <span className="tag__icon">
          <Icon name={icon} />
        </span>
      ) : null}
      <span className="tag__label">{children}</span>
      {dismissible ? (
        <button
          type="button"
          className="tag__x"
          onClick={dismiss}
          aria-label={`Remove ${typeof children === "string" ? children : "tag"}`}
        >
          <Icon name="x" />
        </button>
      ) : null}
    </span>
  );
}
