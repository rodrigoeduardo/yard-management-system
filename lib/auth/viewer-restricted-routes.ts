/**
 * Routes that only perform writes (Entrada, Saída) and are therefore hidden
 * from viewer sessions (issue #314): filtered out of the nav/home UI, and
 * blocked server-side (`lib/supabase/middleware.ts`) if requested directly.
 * Every read route (Estoque, Materiais, load/removal detail, receipts,
 * print pages) stays off this list — viewers can read the whole app.
 */
export const VIEWER_RESTRICTED_PATHS = ["/loads/new", "/removals/new"] as const;

/** Exact match only — nested routes like /loads/[id]/print are read paths. */
export function isViewerRestrictedPath(pathname: string): boolean {
  return (VIEWER_RESTRICTED_PATHS as readonly string[]).includes(pathname);
}
