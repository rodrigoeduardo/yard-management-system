import { describe, expect, it } from "vitest";
import {
  DEFAULT_STOCK_DIR,
  DEFAULT_STOCK_ORDER,
  parseStockSearchParams,
  STOCK_PAGE_SIZE,
  stockSearchHref,
} from "./stock-query";

describe("parseStockSearchParams", () => {
  it("returns defaults when no stock params are present", () => {
    expect(parseStockSearchParams({})).toEqual({
      q: "",
      order: DEFAULT_STOCK_ORDER,
      dir: DEFAULT_STOCK_DIR,
      page: 1,
    });
  });

  it("reads stock_q, stock_order, stock_dir and stock_page", () => {
    expect(
      parseStockSearchParams({
        stock_q: "NF-1",
        stock_order: "nfWeight",
        stock_dir: "asc",
        stock_page: "3",
      }),
    ).toEqual({ q: "NF-1", order: "nfWeight", dir: "asc", page: 3 });
  });

  it("ignores unrelated params (e.g. a future removal_ namespace)", () => {
    expect(
      parseStockSearchParams({ removal_q: "should-be-ignored", stock_q: "abc" }),
    ).toEqual({ q: "abc", order: DEFAULT_STOCK_ORDER, dir: DEFAULT_STOCK_DIR, page: 1 });
  });

  it("falls back to defaults for an invalid order key", () => {
    expect(parseStockSearchParams({ stock_order: "bogus" }).order).toBe(
      DEFAULT_STOCK_ORDER,
    );
  });

  it("falls back to defaults for an invalid direction", () => {
    expect(parseStockSearchParams({ stock_dir: "sideways" }).dir).toBe(
      DEFAULT_STOCK_DIR,
    );
  });

  it("falls back to page 1 for a non-numeric, zero, negative or fractional page", () => {
    expect(parseStockSearchParams({ stock_page: "abc" }).page).toBe(1);
    expect(parseStockSearchParams({ stock_page: "0" }).page).toBe(1);
    expect(parseStockSearchParams({ stock_page: "-2" }).page).toBe(1);
    expect(parseStockSearchParams({ stock_page: "1.5" }).page).toBe(1);
  });

  it("accepts a URLSearchParams instance", () => {
    const params = new URLSearchParams("stock_q=abc&stock_page=2");
    expect(parseStockSearchParams(params)).toEqual({
      q: "abc",
      order: DEFAULT_STOCK_ORDER,
      dir: DEFAULT_STOCK_DIR,
      page: 2,
    });
  });

  it("takes the first value when a key repeats in a Record's array form", () => {
    expect(parseStockSearchParams({ stock_q: ["first", "second"] }).q).toBe(
      "first",
    );
  });
});

describe("stockSearchHref", () => {
  it("sets stock_q and resets stock_page when the search changes", () => {
    const current = new URLSearchParams("stock_q=old&stock_page=3");
    expect(stockSearchHref(current, { q: "new" })).toBe("?stock_q=new");
  });

  it("removes stock_q entirely when cleared to an empty string", () => {
    const current = new URLSearchParams("stock_q=old&stock_page=3");
    expect(stockSearchHref(current, { q: "" })).toBe("");
  });

  it("sets stock_order/stock_dir and resets stock_page when order changes", () => {
    const current = new URLSearchParams("stock_page=5");
    expect(
      stockSearchHref(current, { order: "itemCount", dir: "asc" }),
    ).toBe("?stock_dir=asc&stock_order=itemCount");
  });

  it("omits stock_order/stock_dir when they equal the defaults", () => {
    const current = new URLSearchParams("stock_order=itemCount&stock_dir=asc");
    expect(
      stockSearchHref(current, {
        order: DEFAULT_STOCK_ORDER,
        dir: DEFAULT_STOCK_DIR,
      }),
    ).toBe("");
  });

  it("sets stock_page without touching search or order", () => {
    const current = new URLSearchParams("stock_q=abc&stock_order=itemCount");
    expect(stockSearchHref(current, { page: 2 })).toBe(
      "?stock_order=itemCount&stock_page=2&stock_q=abc",
    );
  });

  it("omits stock_page when it is 1", () => {
    const current = new URLSearchParams("stock_page=4");
    expect(stockSearchHref(current, { page: 1 })).toBe("");
  });

  it("preserves unrelated (e.g. future removal_) params untouched", () => {
    const current = new URLSearchParams("removal_page=2&stock_q=old");
    expect(stockSearchHref(current, { q: "new" })).toBe(
      "?removal_page=2&stock_q=new",
    );
  });
});

describe("STOCK_PAGE_SIZE", () => {
  it("is 20 rows per page", () => {
    expect(STOCK_PAGE_SIZE).toBe(20);
  });
});
