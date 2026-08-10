import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(path.join(__dirname, "layout.tsx"), "utf-8");

describe("authenticated layout nav shell", () => {
  it("renders the Header nav shell", () => {
    expect(source).toMatch(/<Header\b/);
  });

  it("derives avatar initials from the signed-in user's email", () => {
    expect(source).toMatch(/getUserInitials/);
  });

  it("pads page content at the bottom on mobile so it never overlaps the fixed tab bar, and removes the padding at md:", () => {
    const mainBlockMatch = source.match(/<main[\s\S]*?>/);
    expect(mainBlockMatch).not.toBeNull();
    const mainBlock = mainBlockMatch![0];
    expect(mainBlock).toMatch(/\bpb-(?:16|20|24)\b/);
    expect(mainBlock).toMatch(/\bmd:pb-0\b/);
  });

  it("removes the mobile tab-bar padding reservation in print (issue #95)", () => {
    const mainBlockMatch = source.match(/<main[\s\S]*?>/);
    expect(mainBlockMatch).not.toBeNull();
    expect(mainBlockMatch![0]).toMatch(/\bprint:pb-0\b/);
  });

  it("resolves the session's role and passes isViewer down to Header (issue #314)", () => {
    expect(source).toMatch(/getCurrentUserRole/);
    expect(source).toMatch(/<Header[\s\S]*?isViewer=/);
  });
});
