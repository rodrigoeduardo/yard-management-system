export interface Crumb {
  href: string;
  label: string;
}

export const HOME_CRUMB: Crumb = { href: "/", label: "Início" };

/**
 * Builds a breadcrumb trail starting from the home crumb, followed by the
 * given ancestor crumbs in order. The last crumb is the current page (leaf).
 */
export function buildTrail(...crumbs: Crumb[]): Crumb[] {
  return [HOME_CRUMB, ...crumbs];
}
