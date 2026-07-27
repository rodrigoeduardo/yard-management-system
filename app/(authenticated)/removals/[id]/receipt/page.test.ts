import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(__dirname, "page.tsx"), "utf-8");

describe("Removal receipt print page shell (issue #270)", () => {
  it("hides the back-header in print", () => {
    const backHeaderWrapperMatch = source.match(
      /<div className="([^"]*)">\s*<PageBackHeader/,
    );
    expect(backHeaderWrapperMatch).not.toBeNull();
    expect(backHeaderWrapperMatch![1]).toMatch(/\bprint:hidden\b/);
  });

  it("validates the route param before querying, and 404s on an invalid id", () => {
    expect(source).toMatch(/isValidRemovalId/);
    expect(source).toMatch(/notFound/);
  });

  it("renders dynamically (the receipt reflects the latest removal data)", () => {
    expect(source).toMatch(/export const dynamic = "force-dynamic"/);
  });
});

describe("Removal receipt print page size (issue #286)", () => {
  it("mounts PrintPageStyle with an A4 @page rule with non-zero margins instead of a route-scoped CSS Module", () => {
    // Same rationale as the QR label route: a CSS Module's stylesheet link
    // is never removed from <head> on client-side navigation, so a stale
    // 100x50mm rule from the label route could otherwise win here.
    expect(source).not.toMatch(/import\s+["']\.\/print\.module\.css["']/);
    expect(source).toMatch(
      /import\s+\{\s*PrintPageStyle\s*\}\s+from\s+["']@\/components\/print\/print-page-style["']/,
    );
    expect(source).toMatch(/<PrintPageStyle\s+css=\{RECEIPT_PAGE_CSS\}\s*\/>/);

    const cssConstMatch = source.match(
      /RECEIPT_PAGE_CSS\s*=\s*["'`]([\s\S]*?)["'`];/,
    );
    expect(cssConstMatch).not.toBeNull();
    const css = cssConstMatch![1];
    expect(css).not.toMatch(/100mm 50mm/);

    const pageRuleMatch = css.match(/@page\s*\{([\s\S]*?)\}/);
    expect(pageRuleMatch).not.toBeNull();
    const pageRule = pageRuleMatch![1];
    expect(pageRule).toMatch(/size:\s*A4;/);

    const marginMatch = pageRule.match(/margin:\s*([^;]+);/);
    expect(marginMatch).not.toBeNull();
    const marginValues = marginMatch![1].trim().split(/\s+/);
    expect(marginValues.length).toBeGreaterThan(0);
    for (const value of marginValues) {
      expect(value).not.toMatch(/^0(mm|px|rem)?$/);
    }
  });
});
