"use client";

// A Button that opens the site menu (via lib/menu-events.ts) instead of
// navigating — for Server Components like CaseStudyNav that need a menu
// trigger but can't attach an onClick themselves.

import { Button, type Props as ButtonProps } from "@/components/ui/Button";
import { requestMenuOpen } from "@/lib/menu-events";

type Props = Omit<Extract<ButtonProps, { href?: undefined }>, "onClick">;

export function OpenMenuButton(props: Props) {
  return (
    <Button
      {...props}
      aria-haspopup="dialog"
      aria-controls="site-menu"
      onClick={(e) => requestMenuOpen({ x: e.clientX, y: e.clientY })}
    />
  );
}
