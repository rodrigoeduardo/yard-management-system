"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

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
  const [draft, setDraft] = useState(value);

  // Stay in sync when the URL changes from elsewhere (back/forward nav).
  // Adjusting state during render (rather than in an effect) avoids the
  // extra cascading render that a `useEffect(() => setDraft(value), [value])`
  // would cause.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) {
      return;
    }
    const timeout = setTimeout(() => onSearch(draft), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return (
    <Input
      type="search"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      placeholder="Buscar por NF ou motorista..."
      aria-label="Buscar em remoções"
      className="max-w-xs"
    />
  );
}
