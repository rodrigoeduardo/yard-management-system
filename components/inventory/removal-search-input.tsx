"use client";

import { Input } from "@/components/ui/input";
import { useDebouncedSearchDraft } from "@/components/inventory/use-debounced-search-draft";

/**
 * Search box for the removals section. Keeps typing local (uncontrolled
 * from the URL's point of view) and only calls `onSearch` — which pushes a
 * new `rem_q` URL param — after the user pauses typing, so every keystroke
 * doesn't trigger a navigation. Mirrors `StockSearchInput`.
 */
export function RemovalSearchInput({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (q: string) => void;
}) {
  const [draft, setDraft] = useDebouncedSearchDraft(value, onSearch);

  return (
    <Input
      type="search"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      placeholder="Buscar por NF ou motorista..."
      aria-label="Buscar em remoções"
      className="flex-1 min-w-0 md:max-w-xs"
    />
  );
}
