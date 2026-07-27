import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "print.module.css"), "utf-8");
const pageSource = readFileSync(path.join(__dirname, "page.tsx"), "utf-8");

describe("QR label print page size (issue #286)", () => {
  it("declares a 100x50mm @page rule scoped to this route's print stylesheet", () => {
    const printBlockMatch = css.match(/@media print\s*\{[\s\S]*?\n\}/);
    expect(printBlockMatch).not.toBeNull();
    const printBlock = printBlockMatch![0];
    expect(printBlock).toMatch(/@page\s*\{[\s\S]*?size:\s*100mm 50mm;[\s\S]*?margin:\s*0;[\s\S]*?\}/);
  });

  it("is imported by the label print route so the rule loads only for this page", () => {
    expect(pageSource).toMatch(/import\s+["']\.\/print\.module\.css["'];?/);
  });
});
