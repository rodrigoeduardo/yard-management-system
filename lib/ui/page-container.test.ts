import { describe, expect, it } from "vitest";
import { PAGE_CONTAINER_DESKTOP_CLASS } from "./page-container";

describe("PAGE_CONTAINER_DESKTOP_CLASS", () => {
  it("centers content and caps it at the canonical dashboard width (1060px)", () => {
    expect(PAGE_CONTAINER_DESKTOP_CLASS).toMatch(/\bmd:mx-auto\b/);
    expect(PAGE_CONTAINER_DESKTOP_CLASS).toMatch(/\bmd:w-full\b/);
    expect(PAGE_CONTAINER_DESKTOP_CLASS).toMatch(/\bmd:max-w-\[1060px\]/);
  });

  it("applies horizontal padding only at the md breakpoint, leaving mobile untouched", () => {
    expect(PAGE_CONTAINER_DESKTOP_CLASS).toMatch(/\bmd:px-10\b/);
    expect(PAGE_CONTAINER_DESKTOP_CLASS.split(/\s+/)).not.toContainEqual(
      expect.stringMatching(/^px-\d/),
    );
  });
});
