import { describe, expect, it } from "vitest";
import {
  countActiveStockFilters,
  DEFAULT_STOCK_DIR,
  DEFAULT_STOCK_ORDER,
  hasActiveStockFilters,
  parseStockSearchParams,
  STOCK_PAGE_SIZE,
  stockSearchHref,
  stockStatusLabel,
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

  it("is undefined for date/weight filters when absent", () => {
    const parsed = parseStockSearchParams({});
    expect(parsed.dateFrom).toBeUndefined();
    expect(parsed.dateTo).toBeUndefined();
    expect(parsed.weightMin).toBeUndefined();
    expect(parsed.weightMax).toBeUndefined();
  });

  it("defaults showFinished to undefined (shown) when stock_show_finished is absent", () => {
    expect(parseStockSearchParams({}).showFinished).toBeUndefined();
  });

  it("reads stock_show_finished=0 as showFinished: false", () => {
    expect(
      parseStockSearchParams({ stock_show_finished: "0" }).showFinished,
    ).toBe(false);
  });

  it("treats any other stock_show_finished value as the default (shown)", () => {
    expect(
      parseStockSearchParams({ stock_show_finished: "1" }).showFinished,
    ).toBeUndefined();
    expect(
      parseStockSearchParams({ stock_show_finished: "bogus" }).showFinished,
    ).toBeUndefined();
  });

  it("reads stock_date_from and stock_date_to independently (either alone works)", () => {
    const from = parseStockSearchParams({ stock_date_from: "2026-01-01" });
    expect(from.dateFrom).toBe("2026-01-01");
    expect(from.dateTo).toBeUndefined();

    const to = parseStockSearchParams({ stock_date_to: "2026-01-31" });
    expect(to.dateFrom).toBeUndefined();
    expect(to.dateTo).toBe("2026-01-31");
  });

  it("falls back to undefined for a malformed date param", () => {
    expect(
      parseStockSearchParams({ stock_date_from: "not-a-date" }).dateFrom,
    ).toBeUndefined();
    expect(
      parseStockSearchParams({ stock_date_from: "2026/01/01" }).dateFrom,
    ).toBeUndefined();
  });

  it("reads stock_weight_min and stock_weight_max independently (gt/lt alone work)", () => {
    const min = parseStockSearchParams({ stock_weight_min: "10" });
    expect(min.weightMin).toBe("10");
    expect(min.weightMax).toBeUndefined();

    const max = parseStockSearchParams({ stock_weight_max: "500" });
    expect(max.weightMin).toBeUndefined();
    expect(max.weightMax).toBe("500");
  });

  it("reads both bounds together for a range filter", () => {
    expect(
      parseStockSearchParams({ stock_weight_min: "10", stock_weight_max: "500" }),
    ).toMatchObject({ weightMin: "10", weightMax: "500" });
  });

  it("falls back to undefined for a non-numeric or negative weight param", () => {
    expect(
      parseStockSearchParams({ stock_weight_min: "abc" }).weightMin,
    ).toBeUndefined();
    expect(
      parseStockSearchParams({ stock_weight_min: "-5" }).weightMin,
    ).toBeUndefined();
    expect(
      parseStockSearchParams({ stock_weight_min: "" }).weightMin,
    ).toBeUndefined();
  });
});

describe("countActiveStockFilters / hasActiveStockFilters", () => {
  it("counts zero when no filters are set", () => {
    const query = parseStockSearchParams({});
    expect(countActiveStockFilters(query)).toBe(0);
    expect(hasActiveStockFilters(query)).toBe(false);
  });

  it("counts each active bound independently", () => {
    const query = parseStockSearchParams({
      stock_date_from: "2026-01-01",
      stock_weight_max: "100",
    });
    expect(countActiveStockFilters(query)).toBe(2);
    expect(hasActiveStockFilters(query)).toBe(true);
  });

  it("counts a full range (both date bounds and both weight bounds) as 4", () => {
    const query = parseStockSearchParams({
      stock_date_from: "2026-01-01",
      stock_date_to: "2026-01-31",
      stock_weight_min: "10",
      stock_weight_max: "500",
    });
    expect(countActiveStockFilters(query)).toBe(4);
  });

  it("counts showFinished only when set to the non-default (off) value", () => {
    expect(countActiveStockFilters(parseStockSearchParams({}))).toBe(0);
    expect(
      countActiveStockFilters(
        parseStockSearchParams({ stock_show_finished: "0" }),
      ),
    ).toBe(1);
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

  it("sets stock_date_from/stock_date_to and resets stock_page when the date filter changes", () => {
    const current = new URLSearchParams("stock_page=3");
    expect(
      stockSearchHref(current, { dateFrom: "2026-01-01", dateTo: "2026-01-31" }),
    ).toBe("?stock_date_from=2026-01-01&stock_date_to=2026-01-31");
  });

  it("sets only stock_date_from when stock_date_to is left untouched", () => {
    const current = new URLSearchParams();
    expect(stockSearchHref(current, { dateFrom: "2026-01-01" })).toBe(
      "?stock_date_from=2026-01-01",
    );
  });

  it("sets stock_weight_min/stock_weight_max and resets stock_page when the weight filter changes", () => {
    const current = new URLSearchParams("stock_page=2");
    expect(
      stockSearchHref(current, { weightMin: "10", weightMax: "500" }),
    ).toBe("?stock_weight_max=500&stock_weight_min=10");
  });

  it("removes a filter param entirely when cleared to an empty string", () => {
    const current = new URLSearchParams(
      "stock_date_from=2026-01-01&stock_weight_min=10",
    );
    expect(
      stockSearchHref(current, { dateFrom: "", weightMin: "" }),
    ).toBe("");
  });

  it("clears all four filter params without touching stock_q", () => {
    const current = new URLSearchParams(
      "stock_q=abc&stock_date_from=2026-01-01&stock_date_to=2026-01-31&stock_weight_min=10&stock_weight_max=500",
    );
    expect(
      stockSearchHref(current, {
        dateFrom: "",
        dateTo: "",
        weightMin: "",
        weightMax: "",
      }),
    ).toBe("?stock_q=abc");
  });

  it("preserves an active filter when only the page changes", () => {
    const current = new URLSearchParams("stock_weight_min=10");
    expect(stockSearchHref(current, { page: 2 })).toBe(
      "?stock_page=2&stock_weight_min=10",
    );
  });

  it("sets stock_show_finished=0 and resets stock_page when showFinished is turned off", () => {
    const current = new URLSearchParams("stock_page=3");
    expect(stockSearchHref(current, { showFinished: false })).toBe(
      "?stock_show_finished=0",
    );
  });

  it("removes stock_show_finished when showFinished is turned back on (default)", () => {
    const current = new URLSearchParams("stock_show_finished=0&stock_page=3");
    expect(stockSearchHref(current, { showFinished: true })).toBe("");
  });
});

describe("STOCK_PAGE_SIZE", () => {
  it("is 20 rows per page", () => {
    expect(STOCK_PAGE_SIZE).toBe(20);
  });
});

describe("stockStatusLabel", () => {
  it("reflects the default order and direction, no filters", () => {
    expect(
      stockStatusLabel({ q: "", order: "entryDate", dir: "desc", page: 1 }),
    ).toBe("Ordenado por Data de Entrada (desc) · somente visualização");
  });

  it("reflects a changed order and direction", () => {
    expect(
      stockStatusLabel({ q: "", order: "nfWeight", dir: "asc", page: 1 }),
    ).toBe("Ordenado por Peso da NF (asc) · somente visualização");
  });

  it("indicates active filters", () => {
    expect(
      stockStatusLabel({
        q: "",
        order: "entryDate",
        dir: "desc",
        page: 1,
        weightMin: "10",
      }),
    ).toBe(
      "Ordenado por Data de Entrada (desc) · filtros ativos · somente visualização",
    );
  });
});
