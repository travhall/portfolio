"use client";

/**
 * EmailButton — wraps a Button to open a small glass popover offering
 * "Open in mail app" and "Copy email" side by side, instead of
 * navigating directly. The panel grows from the trigger's corner so it
 * reads as attached to it. Closes on outside click, Escape, or selection.
 */

import { useEffect, useRef, useState } from "react";
import { Button, type Props as ButtonProps } from "./Button";
import { Icon } from "./Icon";
import { siteConfig } from "@/lib/site-config";

type Props = Omit<Extract<ButtonProps, { href?: undefined }>, "onClick"> & {
  onAction?: () => void;
  /** which side of the trigger the panel opens toward (default "top") */
  panelPlacement?: "top" | "bottom";
};

export function EmailButton({ onAction, panelPlacement = "top", ...buttonProps }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(id);
  }, [copied]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
    } catch {
      // clipboard unavailable — leave the panel open as a visible fallback
    }
  }

  return (
    <div className="email-action" ref={rootRef}>
      <Button
        {...buttonProps}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
      />
      {open && (
        <div
          className={`email-action__panel glass-surface email-action__panel--${panelPlacement}`}
          role="menu"
        >
          <a
            className="email-action__option"
            role="menuitem"
            href={`mailto:${siteConfig.email}`}
            onClick={() => {
              setOpen(false);
              onAction?.();
            }}
          >
            <span>Open in mail</span>
            <Icon name="send" />
          </a>
          <button
            type="button"
            className="email-action__option"
            role="menuitem"
            onClick={copyEmail}
          >
            <span>{copied ? "Copied!" : "Copy email"}</span>
            <Icon name={copied ? "check" : "copy"} />
          </button>
        </div>
      )}
    </div>
  );
}
