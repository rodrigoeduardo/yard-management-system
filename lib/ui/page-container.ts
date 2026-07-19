/**
 * Shared desktop content-container convention for authenticated pages.
 *
 * Every top-level authenticated page (dashboard, loads/new, removals/new,
 * inventory) centers its content and caps it at the same max-width, so the
 * pages present a consistent horizontal margin on desktop. The canonical
 * width is the dashboard's original width (~1060px).
 *
 * Mobile layout is untouched — these classes only take effect at `md:`.
 */
export const PAGE_CONTAINER_DESKTOP_CLASS =
  "md:mx-auto md:w-full md:max-w-[1060px] md:px-10";
