"use client";

import { useEffect, useState } from "react";

const DEBOUNCE_MS = 300;

/**
 * Shared logic behind `StockSearchInput` and `RemovalSearchInput`: keeps a
 * local `draft` that updates immediately on every keystroke, and only calls
 * `onSearch` (which pushes a new URL param) after the user pauses typing.
 *
 * The tricky part is staying in sync with `value` (the URL's current query
 * param) without letting our own just-pushed value clobber newer typing.
 * `onSearch` triggers a navigation that eventually round-trips back as a new
 * `value` prop; if that round-trip lands after the user has already typed
 * more characters (queuing a newer, still-pending push), a naive
 * `value !== prevValue` sync would overwrite the newer draft with the stale,
 * just-echoed value — dropping the trailing keystrokes. We avoid that by
 * remembering the last value we ourselves pushed and ignoring incoming
 * `value` updates that merely echo it.
 */
export function useDebouncedSearchDraft(
  value: string,
  onSearch: (q: string) => void,
) {
  const [draft, setDraft] = useState(value);

  // Adjusting state during render (rather than in an effect) avoids the
  // extra cascading render that a `useEffect(() => setDraft(value), [value])`
  // would cause.
  const [prevValue, setPrevValue] = useState(value);
  const [lastPushed, setLastPushed] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    // Only sync from a genuine external change (e.g. browser back/forward).
    // If `value` is just the echo of our own last push, keep whatever the
    // user has typed since — it's already newer.
    if (value !== lastPushed) {
      setDraft(value);
    }
    setLastPushed(value);
  }

  useEffect(() => {
    if (draft === value) {
      return;
    }
    const timeout = setTimeout(() => {
      setLastPushed(draft);
      onSearch(draft);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  return [draft, setDraft] as const;
}
