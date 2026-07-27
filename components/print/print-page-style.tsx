"use client";

import { useEffect } from "react";

type PrintPageStyleProps = {
  css: string;
};

/**
 * Injects a route-scoped `@page` print rule as a real `<style>` element in
 * `<head>`, and removes it on unmount.
 *
 * Why not a CSS Module (the original #286 fix)? Next.js renders a CSS
 * Module's stylesheet as a React 19 hoistable *resource*
 * (`<link rel="stylesheet" precedence="next">`), and React's deletion effect
 * for that resource type only decrements a refcount on unmount — it never
 * calls `removeChild` on the `<link>` itself. `@page` is a document-level
 * at-rule, so once a print route's CSS Module has loaded once, its `@page`
 * rule stays live in the document for every route the user soft-navigates
 * to afterward (e.g. via `PageBackHeader`'s `next/link` back control), not
 * just on a hard reload. A directly inserted `<style>` element is a plain
 * DOM node rather than a hoistable resource, so its cleanup effect actually
 * removes it from `<head>` on unmount.
 */
export function PrintPageStyle({ css }: PrintPageStyleProps) {
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-print-page-style", "");
    style.textContent = css;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, [css]);

  return null;
}
