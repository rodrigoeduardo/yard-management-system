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
