import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Issue #161: every top-level authenticated page must share the same
 * desktop content-container convention (max-width + horizontal padding),
 * sourced from lib/ui/page-container.ts. This test reads each page's
 * source directly, since the dashboard and inventory pages are async
 * server components that fetch data on render.
 */
const pages = [
  { name: "dashboard", file: "page.tsx" },
  { name: "inventory (Estoque)", file: "inventory/page.tsx" },
  { name: "loads/new", file: "loads/new/page.tsx" },
  { name: "removals/new", file: "removals/new/page.tsx" },
];

describe("shared desktop page-container convention", () => {
  for (const { name, file } of pages) {
    it(`${name} imports and applies PAGE_CONTAINER_DESKTOP_CLASS`, () => {
      const source = readFileSync(path.join(__dirname, file), "utf-8");
      expect(source).toMatch(
        /import\s*\{\s*PAGE_CONTAINER_DESKTOP_CLASS\s*\}\s*from\s*"@\/lib\/ui\/page-container"/,
      );
      expect(source).toMatch(/PAGE_CONTAINER_DESKTOP_CLASS/);
    });

    it(`${name} no longer hardcodes a bespoke desktop max-width`, () => {
      const source = readFileSync(path.join(__dirname, file), "utf-8");
      expect(source).not.toMatch(/max-w-4xl/);
      expect(source).not.toMatch(/max-w-6xl/);
      expect(source).not.toMatch(/md:max-w-\[1060px\]/);
    });
  }
});
