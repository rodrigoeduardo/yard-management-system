import { describe, expect, it } from "vitest";
import { getStockTier, isLoadFinished } from "./stock";

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

describe("getStockTier", () => {
  it("is 'none-removed' when no items have been removed yet", () => {
    expect(
      getStockTier({
        itemCount: 10,
        remainingWeight: "100",
        removedItemCount: 0,
      }),
    ).toBe("none-removed");
  });

  it("is 'partial' when some items are removed but the load is not finished", () => {
    expect(
      getStockTier({
        itemCount: 4,
        remainingWeight: "40",
        removedItemCount: 6,
      }),
    ).toBe("partial");
  });

  it("is 'finished' when the load is finished, regardless of removedItemCount", () => {
    expect(
      getStockTier({
        itemCount: 0,
        remainingWeight: "0",
        removedItemCount: 10,
      }),
    ).toBe("finished");
  });

  it("is 'finished' rather than 'none-removed' for a finished load with removedItemCount 0 (e.g. a load created with zero items)", () => {
    expect(
      getStockTier({
        itemCount: 0,
        remainingWeight: "0",
        removedItemCount: 0,
      }),
    ).toBe("finished");
  });
});
