import { describe, expect, it } from "vitest";
import { isLoadFinished } from "./stock";

describe("isLoadFinished", () => {
  it("is finished when item_count and remaining_weight are both zero", () => {
    expect(isLoadFinished({ itemCount: 0, remainingWeight: "0" })).toBe(true);
  });

  it("is not finished when item_count is nonzero", () => {
    expect(isLoadFinished({ itemCount: 1, remainingWeight: "0" })).toBe(
      false,
    );
  });

  it("is not finished when remaining_weight is nonzero", () => {
    expect(isLoadFinished({ itemCount: 0, remainingWeight: "5" })).toBe(
      false,
    );
  });
});
