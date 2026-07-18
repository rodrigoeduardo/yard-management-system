import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(__dirname, "page.tsx"), "utf-8");

describe("QR print page shell (issue #95)", () => {
  it("hides the breadcrumbs trail in print", () => {
    const breadcrumbsWrapperMatch = source.match(
      /<div className="([^"]*)">\s*<Breadcrumbs/,
    );
    expect(breadcrumbsWrapperMatch).not.toBeNull();
    expect(breadcrumbsWrapperMatch![1]).toMatch(/\bprint:hidden\b/);
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
