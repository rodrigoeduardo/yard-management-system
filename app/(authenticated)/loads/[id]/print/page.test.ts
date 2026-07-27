import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(__dirname, "page.tsx"), "utf-8");

describe("QR print page shell (issue #95)", () => {
  it("hides the back-header in print", () => {
    const backHeaderWrapperMatch = source.match(
      /<div className="([^"]*)">\s*<PageBackHeader/,
    );
    expect(backHeaderWrapperMatch).not.toBeNull();
    expect(backHeaderWrapperMatch![1]).toMatch(/\bprint:hidden\b/);
  });

  it("does not force a full-viewport min-height that could add a trailing blank page in print", () => {
    const mainBlockMatch = source.match(/<main[\s\S]*?>/);
    expect(mainBlockMatch).not.toBeNull();
    const mainBlock = mainBlockMatch![0];
    expect(mainBlock).toMatch(/\bprint:min-h-0\b/);
  });

  it("drops the screen-only page padding in print so labels use the @page margin instead", () => {
    const mainBlockMatch = source.match(/<main[\s\S]*?>/);
    expect(mainBlockMatch).not.toBeNull();
    expect(mainBlockMatch![0]).toMatch(/\bprint:p-0\b/);
  });
});

describe("QR label print page size (issue #286)", () => {
  it("mounts PrintPageStyle with a 100x50mm @page rule instead of a route-scoped CSS Module", () => {
    // A CSS Module's stylesheet is a React 19 hoistable resource that never
    // gets removed from <head> on client-side navigation away from this
    // route (see components/print/print-page-style.tsx), so the @page
    // rule must be injected at runtime instead.
    expect(source).not.toMatch(/import\s+["']\.\/print\.module\.css["']/);
    expect(source).toMatch(
      /import\s+\{\s*PrintPageStyle\s*\}\s+from\s+["']@\/components\/print\/print-page-style["']/,
    );
    expect(source).toMatch(/<PrintPageStyle\s+css=\{LABEL_PAGE_CSS\}\s*\/>/);
    expect(source).toMatch(
      /LABEL_PAGE_CSS\s*=\s*["'`][\s\S]*?@page\s*\{[\s\S]*?size:\s*100mm 50mm;[\s\S]*?margin:\s*0;[\s\S]*?\}/,
    );
  });
});
