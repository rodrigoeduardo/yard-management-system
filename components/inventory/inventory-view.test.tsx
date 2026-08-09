import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RemovalQueryState } from "@/lib/inventory/removal-query";
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
  nfWeight: "1.000,00 t",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250,00 t",
  removedItemCount: 0,
  finished: false,
};

const REMOVAL_ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  vehiclePlate: "ABC1234",
  totalRemovedWeight: "100,00 t",
  notasFiscais: "NF-001",
  itemCount: 3,
};

const STOCK_QUERY: StockQueryState = {
  q: "",
  order: "entryDate",
  dir: "desc",
  page: 1,
};

const REMOVAL_QUERY: RemovalQueryState = {
  q: "",
  order: "exitDate",
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
        removalTotal={1}
        removalQuery={REMOVAL_QUERY}
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
        removalTotal={1}
        removalQuery={REMOVAL_QUERY}
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
        removalTotal={0}
        removalQuery={REMOVAL_QUERY}
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

  it("shows dynamic order/filter status labels for both sections, not the old static captions", () => {
    render(
      <InventoryView
        stockRows={[STOCK_ROW]}
        stockTotal={1}
        stockQuery={{ q: "", order: "nfWeight", dir: "asc", page: 1, weightMin: "10" }}
        removalRows={[REMOVAL_ROW]}
        removalTotal={1}
        removalQuery={REMOVAL_QUERY}
      />,
    );

    expect(
      screen.getAllByText(
        "Ordenado por Peso da NF (asc) · filtros ativos · somente visualização",
      ).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "Ordenado por Data de Saída (desc) · somente visualização",
      ).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("remoções mais recentes no topo")).not.toBeInTheDocument();
  });

  it("keeps stock_* and rem_* URL state fully independent: searching removals never touches stock params", () => {
    currentSearchParams = new URLSearchParams(
      "stock_q=steel&stock_order=nfWeight&stock_dir=asc&stock_page=3",
    );
    vi.useFakeTimers();
    render(
      <InventoryView
        stockRows={[STOCK_ROW]}
        stockTotal={1}
        stockQuery={{ q: "steel", order: "nfWeight", dir: "asc", page: 3 }}
        removalRows={[REMOVAL_ROW]}
        removalTotal={1}
        removalQuery={REMOVAL_QUERY}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar em remoções"), {
      target: { value: "Joao" },
    });
    vi.advanceTimersByTime(300);

    const lastCall = push.mock.calls.at(-1)![0] as string;
    expect(lastCall).toContain("stock_q=steel");
    expect(lastCall).toContain("stock_order=nfWeight");
    expect(lastCall).toContain("stock_dir=asc");
    expect(lastCall).toContain("stock_page=3");
    expect(lastCall).toContain("rem_q=Joao");
    vi.useRealTimers();
  });

  it("searching stock never alters rem_* params", () => {
    currentSearchParams = new URLSearchParams(
      "rem_q=Joao&rem_order=itemCount&rem_dir=asc&rem_page=2",
    );
    vi.useFakeTimers();
    render(
      <InventoryView
        stockRows={[STOCK_ROW]}
        stockTotal={1}
        stockQuery={STOCK_QUERY}
        removalRows={[REMOVAL_ROW]}
        removalTotal={1}
        removalQuery={{ q: "Joao", order: "itemCount", dir: "asc", page: 2 }}
      />,
    );

    fireEvent.change(screen.getByLabelText("Buscar no estoque"), {
      target: { value: "steel" },
    });
    vi.advanceTimersByTime(300);

    const lastCall = push.mock.calls.at(-1)![0] as string;
    expect(lastCall).toContain("rem_q=Joao");
    expect(lastCall).toContain("rem_order=itemCount");
    expect(lastCall).toContain("rem_dir=asc");
    expect(lastCall).toContain("rem_page=2");
    expect(lastCall).toContain("stock_q=steel");
    vi.useRealTimers();
  });
});
