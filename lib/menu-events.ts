// Window event that asks the Topbar to open the site menu — lets any
// control on the page (e.g. CaseStudyNav's "All Projects") open it without
// lifting the Topbar's isOpen state into a shared context.

export const MENU_OPEN_EVENT = "site-menu:open";

/** Viewport point the menu's open ripple should radiate from. */
export interface MenuOpenDetail {
  x: number;
  y: number;
}

export function requestMenuOpen(detail: MenuOpenDetail) {
  window.dispatchEvent(
    new CustomEvent<MenuOpenDetail>(MENU_OPEN_EVENT, { detail }),
  );
}
