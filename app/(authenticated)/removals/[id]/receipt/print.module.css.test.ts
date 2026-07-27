import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "print.module.css"), "utf-8");
const pageSource = readFileSync(path.join(__dirname, "page.tsx"), "utf-8");

describe("Removal receipt print page size (issue #286)", () => {
  it("declares an A4 @page rule with non-zero margins on all four sides", () => {
    const printBlockMatch = css.match(/@media print\s*\{[\s\S]*?\n\}/);
    expect(printBlockMatch).not.toBeNull();
    const printBlock = printBlockMatch![0];
    const pageRuleMatch = printBlock.match(/@page\s*\{([\s\S]*?)\}/);
    expect(pageRuleMatch).not.toBeNull();
    const pageRule = pageRuleMatch![1];
    expect(pageRule).toMatch(/size:\s*A4;/);

    const marginMatch = pageRule.match(/margin:\s*([^;]+);/);
    expect(marginMatch).not.toBeNull();
    const marginValues = marginMatch![1].trim().split(/\s+/);
    // shorthand may be 1, 2, 3 or 4 values — every resolved side must be non-zero
    expect(marginValues.length).toBeGreaterThan(0);
    for (const value of marginValues) {
      expect(value).not.toMatch(/^0(mm|px|rem)?$/);
    }
  });

  it("does not declare the 100x50mm label page size", () => {
    expect(css).not.toMatch(/100mm 50mm/);
  });

  it("is imported by the removal receipt route so the rule loads only for this page", () => {
    expect(pageSource).toMatch(/import\s+["']\.\/print\.module\.css["'];?/);
  });
});
