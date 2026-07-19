import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StockQueryState } from "@/lib/inventory/stock-query";
import { InventoryView } from "./inventory-view";
import type { RemovalLogRow } from "./removal-log-table";
import type { StockRow } from "./stock-table";

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/inventory",
  useSearchParams: () => currentSearchParams,
}));

const STOCK_ROW: StockRow = {
  id: "1",
  notaFiscal: "NF-001",
  entryDate: "01/01/2026",
  nfWeight: "1.000,00 kg",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250,00 kg",
  finished: false,
};

const REMOVAL_ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  totalRemovedWeight: "100,00 kg",
  notasFiscais: "NF-001",
  itemCount: 3,
};

const STOCK_QUERY: StockQueryState = {
  q: "",
  order: "entryDate",
  dir: "desc",
  page: 1,
};

beforeEach(() => {
  push.mockClear();
  currentSearchParams = new URLSearchParams();
});

describe("InventoryView", () => {
  it("shows the Estoque Atual section unhidden by default, with Remoções hidden below md:", () => {
    render(
      <InventoryView
        stockRows={[STOCK_ROW]}
        stockTotal={1}
        stockQuery={STOCK_QUERY}
        removalRows={[REMOVAL_ROW]}
      />,
    );

    const stockHeading = screen.getByRole("heading", { name: "Estoque Atual" });
    const removalHeading = screen.getByRole("heading", {
      name: "Histórico de Remoções",
    });

    expect(stockHeading.closest("div")?.parentElement?.className).not.toMatch(
      /\bhidden\b/,
    );
    expect(removalHeading.closest("div")?.parentElement?.className).toMatch(
      /\bhidden md:flex\b/,
    );
  });

  it("switches which section is unhidden on mobile when a segment is selected, keeping both mounted", () => {
    render(
      <InventoryView
        stockRows={[STOCK_ROW]}
        stockTotal={1}
        stockQuery={STOCK_QUERY}
        removalRows={[REMOVAL_ROW]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remoções" }));

    const stockHeading = screen.getByRole("heading", { name: "Estoque Atual" });
    const removalHeading = screen.getByRole("heading", {
      name: "Histórico de Remoções",
    });

    expect(stockHeading.closest("div")?.parentElement?.className).toMatch(
      /\bhidden md:flex\b/,
    );
    expect(removalHeading.closest("div")?.parentElement?.className).not.toMatch(
      /\bhidden\b/,
    );
  });

  it("renders a segmented control with both segments, hidden at md:", () => {
    render(
      <InventoryView
        stockRows={[]}
        stockTotal={0}
        stockQuery={STOCK_QUERY}
        removalRows={[]}
      />,
    );

    const current = screen.getByRole("button", { name: "Estoque Atual" });
    const removals = screen.getByRole("button", { name: "Remoções" });

    expect(current).toBeInTheDocument();
    expect(removals).toBeInTheDocument();
    expect(current.closest('[data-slot="segmented-control"]')?.className).toMatch(
      /\bmd:hidden\b/,
    );
  });
});
