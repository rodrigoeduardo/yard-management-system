export interface AppNavItem {
  href: string;
  /** Short label used in the mobile bottom tab bar. */
  mobileLabel: string;
  /** Full label used in the desktop top-nav. */
  desktopLabel: string;
  /**
   * Pathname prefix that marks this item as the active section. "/" matches
   * only the exact root path; any other prefix also matches its sub-routes
   * (e.g. "/loads" matches "/loads/new" and "/loads/[id]/print").
   */
  matchPrefix: string;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/", mobileLabel: "Início", desktopLabel: "Início", matchPrefix: "/" },
  { href: "/loads/new", mobileLabel: "Carga", desktopLabel: "Nova Carga", matchPrefix: "/loads" },
  {
    href: "/removals/new",
    mobileLabel: "Remoção",
    desktopLabel: "Nova Remoção",
    matchPrefix: "/removals",
  },
  { href: "/inventory", mobileLabel: "Estoque", desktopLabel: "Estoque", matchPrefix: "/inventory" },
];

/** Whether `pathname` falls under the given nav item's section. */
export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  if (item.matchPrefix === "/") {
    return pathname === "/";
  }
  return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
}
