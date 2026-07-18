import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(path.join(__dirname, "globals.css"), "utf-8");

describe("design tokens (globals.css)", () => {
  it("defines the handoff palette as named tokens in :root", () => {
    expect(css).toMatch(/--background:\s*oklch\(0\.966 0\.004 250\)/);
    expect(css).toMatch(/--card:\s*oklch\(1 0 0\)/);
    expect(css).toMatch(/--border:\s*oklch\(0\.908 0\.008 250\)/);
    expect(css).toMatch(/--primary:\s*oklch\(0\.51 0\.13 245\)/);
    expect(css).toMatch(/--accent:\s*oklch\(0\.93 0\.035 245\)/);
    expect(css).toMatch(/--accent-foreground:\s*oklch\(0\.44 0\.12 245\)/);
    expect(css).toMatch(/--success:\s*oklch\(0\.93 0\.05 150\)/);
    expect(css).toMatch(/--success-foreground:\s*oklch\(0\.38 0\.09 150\)/);
    expect(css).toMatch(/--foreground:\s*oklch\(0\.225 0\.015 260\)/);
    expect(css).toMatch(/--muted-foreground:\s*oklch\(0\.52 0\.015 260\)/);
  });

  it("exposes success as a Tailwind-consumable color token", () => {
    expect(css).toMatch(/--color-success:\s*var\(--success\)/);
    expect(css).toMatch(/--color-success-foreground:\s*var\(--success-foreground\)/);
  });

  it("defines named radii covering cards/inputs (12-16px), buttons (12-14px) and full pills", () => {
    expect(css).toMatch(/--radius-card:\s*1rem/);
    expect(css).toMatch(/--radius-input:\s*0\.75rem/);
    expect(css).toMatch(/--radius-button:\s*0\.75rem/);
    expect(css).toMatch(/--radius-pill:\s*9999px/);
  });

  it("wires --font-sans and --font-mono theme keys to the loaded font variables", () => {
    expect(css).toMatch(/--font-sans:\s*var\(--font-sans\)/);
    expect(css).toMatch(/--font-mono:\s*var\(--font-mono\)/);
    expect(css).not.toMatch(/--font-geist/);
  });

  it("keeps the body/base app shell wired to the token-driven background and text", () => {
    expect(css).toMatch(/body\s*\{\s*@apply bg-background text-foreground;/);
  });

  it("does not add a new .dark theme", () => {
    const darkBlockCount = (css.match(/\.dark\s*\{/g) ?? []).length;
    expect(darkBlockCount).toBeLessThanOrEqual(1);
  });

  it("defines @page margins and forces a white background for print (issue #95)", () => {
    const printBlockMatch = css.match(/@media print\s*\{[\s\S]*?\n\}/);
    expect(printBlockMatch).not.toBeNull();
    const printBlock = printBlockMatch![0];
    expect(printBlock).toMatch(/@page\s*\{[\s\S]*?margin:[\s\S]*?\}/);
    expect(printBlock).toMatch(/background:\s*(#fff|white)/i);
  });
});
