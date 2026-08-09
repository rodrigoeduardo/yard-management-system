import { describe, expect, it } from "vitest";
import {
  formatGeneratedAt,
  inventoryQueryString,
  isInventoryPrintRoute,
} from "./print";

describe("isInventoryPrintRoute", () => {
  it("matches the inventory overview print route", () => {
    expect(isInventoryPrintRoute("/inventory/print")).toBe(true);
  });

  it("does not match the Estoque page or other routes", () => {
    expect(isInventoryPrintRoute("/inventory")).toBe(false);
    expect(isInventoryPrintRoute("/inventory/print/")).toBe(false);
    expect(isInventoryPrintRoute("/")).toBe(false);
    expect(
      isInventoryPrintRoute(
        "/removals/5b1f6f2e-6b0a-4b8a-9b0a-2f2e6b0a4b8a/receipt",
      ),
    ).toBe(false);
  });
});

describe("formatGeneratedAt", () => {
  it("formats the generation timestamp so a filed copy is dated", () => {
    expect(formatGeneratedAt(new Date("2026-03-05T12:00:00Z"))).toBe(
      "05/03/2026 · 09:00",
    );
  });
});

describe("inventoryQueryString", () => {
  it("carries stock_* and rem_* params through", () => {
    const qs = inventoryQueryString({
      stock_q: "Aço",
      stock_order: "nfWeight",
      rem_dir: "asc",
    });
    const params = new URLSearchParams(qs.replace(/^\?/, ""));
    expect(params.get("stock_q")).toBe("Aço");
    expect(params.get("stock_order")).toBe("nfWeight");
    expect(params.get("rem_dir")).toBe("asc");
  });

  it("drops params outside the stock_*/rem_* namespaces", () => {
    const qs = inventoryQueryString({
      stock_q: "aco",
      unrelated: "1",
      page: "2",
    });
    expect(qs).toBe("?stock_q=aco");
  });

  it("returns an empty string when there are no relevant params", () => {
    expect(inventoryQueryString({})).toBe("");
    expect(inventoryQueryString({ unrelated: "1" })).toBe("");
  });

  it("takes the first value of an array param", () => {
    const qs = inventoryQueryString({ stock_q: ["first", "second"] });
    expect(qs).toBe("?stock_q=first");
  });
});
