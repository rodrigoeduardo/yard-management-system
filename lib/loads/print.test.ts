import { describe, expect, it } from "vitest";
import { isValidLoadId } from "./print";

describe("isValidLoadId", () => {
  it("accepts a well-formed uuid", () => {
    expect(isValidLoadId("5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a")).toBe(true);
  });

  it("rejects a malformed id", () => {
    expect(isValidLoadId("not-a-uuid")).toBe(false);
  });
});
