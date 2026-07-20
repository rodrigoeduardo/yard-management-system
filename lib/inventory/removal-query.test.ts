import { describe, expect, it } from "vitest";
import {
  countActiveRemovalFilters,
  DEFAULT_REMOVAL_DIR,
  DEFAULT_REMOVAL_ORDER,
  hasActiveRemovalFilters,
  parseRemovalSearchParams,
  REMOVAL_PAGE_SIZE,
  removalSearchHref,
  removalStatusLabel,
} from "./removal-query";

describe("parseRemovalSearchParams", () => {
  it("returns defaults when no rem params are present", () => {
    expect(parseRemovalSearchParams({})).toEqual({
      q: "",
      order: DEFAULT_REMOVAL_ORDER,
      dir: DEFAULT_REMOVAL_DIR,
      page: 1,
    });
  });

  it("reads rem_q, rem_order, rem_dir and rem_page", () => {
    expect(
      parseRemovalSearchParams({
        rem_q: "João",
        rem_order: "totalRemovedWeight",
        rem_dir: "asc",
        rem_page: "3",
      }),
    ).toEqual({ q: "João", order: "totalRemovedWeight", dir: "asc", page: 3 });
  });

  it("ignores unrelated (e.g. stock_*) params", () => {
    expect(
      parseRemovalSearchParams({ stock_q: "should-be-ignored", rem_q: "abc" }),
    ).toEqual({ q: "abc", order: DEFAULT_REMOVAL_ORDER, dir: DEFAULT_REMOVAL_DIR, page: 1 });
  });

  it("falls back to defaults for an invalid order key", () => {
    expect(parseRemovalSearchParams({ rem_order: "bogus" }).order).toBe(
      DEFAULT_REMOVAL_ORDER,
    );
  });

  it("falls back to defaults for an invalid direction", () => {
    expect(parseRemovalSearchParams({ rem_dir: "sideways" }).dir).toBe(
      DEFAULT_REMOVAL_DIR,
    );
  });

  it("falls back to page 1 for a non-numeric, zero, negative or fractional page", () => {
    expect(parseRemovalSearchParams({ rem_page: "abc" }).page).toBe(1);
    expect(parseRemovalSearchParams({ rem_page: "0" }).page).toBe(1);
    expect(parseRemovalSearchParams({ rem_page: "-2" }).page).toBe(1);
    expect(parseRemovalSearchParams({ rem_page: "1.5" }).page).toBe(1);
  });

  it("accepts a URLSearchParams instance", () => {
    const params = new URLSearchParams("rem_q=abc&rem_page=2");
    expect(parseRemovalSearchParams(params)).toEqual({
      q: "abc",
      order: DEFAULT_REMOVAL_ORDER,
      dir: DEFAULT_REMOVAL_DIR,
      page: 2,
    });
  });

  it("takes the first value when a key repeats in a Record's array form", () => {
    expect(parseRemovalSearchParams({ rem_q: ["first", "second"] }).q).toBe(
      "first",
    );
  });

  it("is undefined for date/weight filters when absent", () => {
    const parsed = parseRemovalSearchParams({});
    expect(parsed.dateFrom).toBeUndefined();
    expect(parsed.dateTo).toBeUndefined();
    expect(parsed.weightMin).toBeUndefined();
    expect(parsed.weightMax).toBeUndefined();
  });

  it("reads rem_date_from and rem_date_to independently (either alone works)", () => {
    const from = parseRemovalSearchParams({ rem_date_from: "2026-01-01" });
    expect(from.dateFrom).toBe("2026-01-01");
    expect(from.dateTo).toBeUndefined();

    const to = parseRemovalSearchParams({ rem_date_to: "2026-01-31" });
    expect(to.dateFrom).toBeUndefined();
    expect(to.dateTo).toBe("2026-01-31");
  });

  it("falls back to undefined for a malformed date param", () => {
    expect(
      parseRemovalSearchParams({ rem_date_from: "not-a-date" }).dateFrom,
    ).toBeUndefined();
    expect(
      parseRemovalSearchParams({ rem_date_from: "2026/01/01" }).dateFrom,
    ).toBeUndefined();
  });

  it("reads rem_weight_min and rem_weight_max independently (gt/lt alone work)", () => {
    const min = parseRemovalSearchParams({ rem_weight_min: "10" });
    expect(min.weightMin).toBe("10");
    expect(min.weightMax).toBeUndefined();

    const max = parseRemovalSearchParams({ rem_weight_max: "500" });
    expect(max.weightMin).toBeUndefined();
    expect(max.weightMax).toBe("500");
  });

  it("reads both bounds together for a range filter", () => {
    expect(
      parseRemovalSearchParams({ rem_weight_min: "10", rem_weight_max: "500" }),
    ).toMatchObject({ weightMin: "10", weightMax: "500" });
  });

  it("falls back to undefined for a non-numeric or negative weight param", () => {
    expect(
      parseRemovalSearchParams({ rem_weight_min: "abc" }).weightMin,
    ).toBeUndefined();
    expect(
      parseRemovalSearchParams({ rem_weight_min: "-5" }).weightMin,
    ).toBeUndefined();
    expect(
      parseRemovalSearchParams({ rem_weight_min: "" }).weightMin,
    ).toBeUndefined();
  });
});

describe("countActiveRemovalFilters / hasActiveRemovalFilters", () => {
  it("counts zero when no filters are set", () => {
    const query = parseRemovalSearchParams({});
    expect(countActiveRemovalFilters(query)).toBe(0);
    expect(hasActiveRemovalFilters(query)).toBe(false);
  });

  it("counts each active bound independently", () => {
    const query = parseRemovalSearchParams({
      rem_date_from: "2026-01-01",
      rem_weight_max: "100",
    });
    expect(countActiveRemovalFilters(query)).toBe(2);
    expect(hasActiveRemovalFilters(query)).toBe(true);
  });

  it("counts a full range (both date bounds and both weight bounds) as 4", () => {
    const query = parseRemovalSearchParams({
      rem_date_from: "2026-01-01",
      rem_date_to: "2026-01-31",
      rem_weight_min: "10",
      rem_weight_max: "500",
    });
    expect(countActiveRemovalFilters(query)).toBe(4);
  });
});

describe("removalSearchHref", () => {
  it("sets rem_q and resets rem_page when the search changes", () => {
    const current = new URLSearchParams("rem_q=old&rem_page=3");
    expect(removalSearchHref(current, { q: "new" })).toBe("?rem_q=new");
  });

  it("removes rem_q entirely when cleared to an empty string", () => {
    const current = new URLSearchParams("rem_q=old&rem_page=3");
    expect(removalSearchHref(current, { q: "" })).toBe("");
  });

  it("sets rem_order/rem_dir and resets rem_page when order changes", () => {
    const current = new URLSearchParams("rem_page=5");
    expect(
      removalSearchHref(current, { order: "itemCount", dir: "asc" }),
    ).toBe("?rem_dir=asc&rem_order=itemCount");
  });

  it("omits rem_order/rem_dir when they equal the defaults", () => {
    const current = new URLSearchParams("rem_order=itemCount&rem_dir=asc");
    expect(
      removalSearchHref(current, {
        order: DEFAULT_REMOVAL_ORDER,
        dir: DEFAULT_REMOVAL_DIR,
      }),
    ).toBe("");
  });

  it("sets rem_page without touching search or order", () => {
    const current = new URLSearchParams("rem_q=abc&rem_order=itemCount");
    expect(removalSearchHref(current, { page: 2 })).toBe(
      "?rem_order=itemCount&rem_page=2&rem_q=abc",
    );
  });

  it("omits rem_page when it is 1", () => {
    const current = new URLSearchParams("rem_page=4");
    expect(removalSearchHref(current, { page: 1 })).toBe("");
  });

  it("preserves unrelated (e.g. stock_*) params untouched", () => {
    const current = new URLSearchParams("stock_page=2&rem_q=old");
    expect(removalSearchHref(current, { q: "new" })).toBe(
      "?rem_q=new&stock_page=2",
    );
  });

  it("sets rem_date_from/rem_date_to and resets rem_page when the date filter changes", () => {
    const current = new URLSearchParams("rem_page=3");
    expect(
      removalSearchHref(current, { dateFrom: "2026-01-01", dateTo: "2026-01-31" }),
    ).toBe("?rem_date_from=2026-01-01&rem_date_to=2026-01-31");
  });

  it("sets only rem_date_from when rem_date_to is left untouched", () => {
    const current = new URLSearchParams();
    expect(removalSearchHref(current, { dateFrom: "2026-01-01" })).toBe(
      "?rem_date_from=2026-01-01",
    );
  });

  it("sets rem_weight_min/rem_weight_max and resets rem_page when the weight filter changes", () => {
    const current = new URLSearchParams("rem_page=2");
    expect(
      removalSearchHref(current, { weightMin: "10", weightMax: "500" }),
    ).toBe("?rem_weight_max=500&rem_weight_min=10");
  });

  it("removes a filter param entirely when cleared to an empty string", () => {
    const current = new URLSearchParams(
      "rem_date_from=2026-01-01&rem_weight_min=10",
    );
    expect(
      removalSearchHref(current, { dateFrom: "", weightMin: "" }),
    ).toBe("");
  });

  it("clears all four filter params without touching rem_q", () => {
    const current = new URLSearchParams(
      "rem_q=abc&rem_date_from=2026-01-01&rem_date_to=2026-01-31&rem_weight_min=10&rem_weight_max=500",
    );
    expect(
      removalSearchHref(current, {
        dateFrom: "",
        dateTo: "",
        weightMin: "",
        weightMax: "",
      }),
    ).toBe("?rem_q=abc");
  });

  it("preserves an active filter when only the page changes", () => {
    const current = new URLSearchParams("rem_weight_min=10");
    expect(removalSearchHref(current, { page: 2 })).toBe(
      "?rem_page=2&rem_weight_min=10",
    );
  });

  it("changing rem_* params never touches stock_* params, and vice versa", () => {
    const current = new URLSearchParams(
      "stock_q=steel&stock_order=nfWeight&stock_dir=asc&stock_page=4",
    );
    const next = removalSearchHref(current, {
      q: "João",
      order: "itemCount",
      dir: "asc",
      dateFrom: "2026-01-01",
    });
    expect(next).toContain("stock_q=steel");
    expect(next).toContain("stock_order=nfWeight");
    expect(next).toContain("stock_dir=asc");
    expect(next).toContain("stock_page=4");
  });
});

describe("REMOVAL_PAGE_SIZE", () => {
  it("is 20 rows per page", () => {
    expect(REMOVAL_PAGE_SIZE).toBe(20);
  });
});

describe("removalStatusLabel", () => {
  it("reflects the default order and direction, no filters", () => {
    expect(
      removalStatusLabel({ q: "", order: "exitDate", dir: "desc", page: 1 }),
    ).toBe("Ordenado por Data de Saída (desc) · somente visualização");
  });

  it("reflects a changed order and direction", () => {
    expect(
      removalStatusLabel({ q: "", order: "itemCount", dir: "asc", page: 1 }),
    ).toBe("Ordenado por Qtd. de Itens (asc) · somente visualização");
  });

  it("indicates active filters", () => {
    expect(
      removalStatusLabel({
        q: "",
        order: "exitDate",
        dir: "desc",
        page: 1,
        dateFrom: "2026-01-01",
      }),
    ).toBe(
      "Ordenado por Data de Saída (desc) · filtros ativos · somente visualização",
    );
  });
});
