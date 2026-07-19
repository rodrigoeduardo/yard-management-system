"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const DEBOUNCE_MS = 300;

/**
 * Search box for the stock section. Keeps typing local (uncontrolled from
 * the URL's point of view) and only calls `onSearch` — which pushes a new
 * `stock_q` URL param — after the user pauses typing, so every keystroke
 * doesn't trigger a navigation.
 */
export function StockSearchInput({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (q: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // Stay in sync when the URL changes from elsewhere (back/forward nav).
  useEffect(() => {
    setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
      placeholder="Buscar por NF ou material..."
      aria-label="Buscar no estoque"
      className="max-w-xs"
    />
  );
}
