"use client";

/**
 * MenuSettings — the menu rail's "Settings" cell: a trigger that opens a
 * small popover above it holding the Theme + Motion toggles. Same surface
 * and grow-from-the-trigger entrance as EmailButton's panel (the rail's
 * other popover), anchored to the trigger's left edge instead of its right
 * since this cell sits at the rail's left end.
 *
 * Closes on outside click or Escape. Escape is caught in the capture phase
 * and stopped there, so it closes only this popover — not the whole menu
 * (Topbar's own Escape listener is a bubble-phase window listener).
 */

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MotionToggle } from "@/components/ui/MotionToggle";

export function MenuSettings({
  menuOpen,
  className = "",
}: {
  /** the site menu's own open state — the popover resets when it closes */
  menuOpen: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [prevMenuOpen, setPrevMenuOpen] = useState(menuOpen);
  if (menuOpen !== prevMenuOpen) {
    setPrevMenuOpen(menuOpen);
    if (!menuOpen) setOpen(false);
  }
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if (!root?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      root?.querySelector<HTMLElement>(".menu-settings__trigger")?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`menu-settings ${className}`}>
      <Button
        variant="link"
        icon="settings"
        className="menu-rail__cell menu-settings__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        Settings
      </Button>
      <div
        id={panelId}
        className="menu-settings__panel"
        role="group"
        aria-label="Display settings"
        hidden={!open}
      >
        <ThemeToggle />
        <MotionToggle />
      </div>
    </div>
  );
}
