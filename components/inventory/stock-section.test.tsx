import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StockQueryState } from "@/lib/inventory/stock-query";
import { StockSection } from "./stock-section";
import type { StockRow } from "./stock-table";

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/inventory",
  useSearchParams: () => currentSearchParams,
}));

const ROW: StockRow = {
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

const DEFAULT_QUERY: StockQueryState = {
  q: "",
  order: "entryDate",
  dir: "desc",
  page: 1,
};

beforeEach(() => {
  push.mockClear();
  currentSearchParams = new URLSearchParams();
});

describe("StockSection", () => {
  it("renders the no-stock empty state (with the add-load CTA) when there is no search and no rows", () => {
    render(<StockSection rows={[]} total={0} query={DEFAULT_QUERY} />);

    expect(screen.getByText("Nenhuma carga em estoque.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Adicionar carga" }),
    ).toBeInTheDocument();
  });

  it("renders a friendly no-results empty state (no CTA) when a search yields no rows", () => {
    render(
      <StockSection rows={[]} total={0} query={{ ...DEFAULT_QUERY, q: "abc" }} />,
    );

    expect(
      screen.getByText("Nenhuma carga encontrada para essa busca."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Adicionar carga" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the search + order/filter controls on one non-wrapping row", () => {
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    const row = screen.getByRole("searchbox").closest("div");
    expect(row?.className).not.toMatch(/\bflex-wrap\b/);
  });

  it("renders a mobile card list hidden at md: and a desktop table hidden below md:", () => {
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    // The card prepends a "NF " label (design frame: `NF {{ c.nf }}`), so match
    // the NF number as a substring rather than requiring exact text equality.
    const occurrences = screen.getAllByText("NF-001", { exact: false });
    expect(occurrences).toHaveLength(2);

    const cardList = occurrences[0].closest('[data-slot="card"]')?.parentElement;
    expect(cardList?.className).toMatch(/\bmd:hidden\b/);

    const tableWrapper = occurrences[1].closest(
      '[data-slot="table-container"]',
    )?.parentElement?.parentElement;
    expect(tableWrapper?.className).toMatch(/\bhidden\b/);
    expect(tableWrapper?.className).toMatch(/\bmd:block\b/);
  });

  it("pushes a stock_q URL update when the search input debounces (page resets)", () => {
    vi.useFakeTimers();
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "NF-2" },
    });
    vi.advanceTimersByTime(300);

    expect(push).toHaveBeenCalledWith("/inventory?stock_q=NF-2", {
      scroll: false,
    });
    vi.useRealTimers();
  });

  it("pushes a stock_order/stock_dir URL update when an order option is picked", () => {
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    fireEvent.click(screen.getByRole("radio", { name: "Peso da NF" }));

    expect(push).toHaveBeenCalledWith("/inventory?stock_order=nfWeight", {
      scroll: false,
    });
  });

  it("pushes a stock_page URL update, preserving q/order, when navigating pages", () => {
    currentSearchParams = new URLSearchParams(
      "stock_q=abc&stock_order=itemCount&stock_dir=asc",
    );
    render(
      <StockSection
        rows={[ROW]}
        total={45}
        query={{ q: "abc", order: "itemCount", dir: "asc", page: 1 }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(push).toHaveBeenCalledWith(
      "/inventory?stock_dir=asc&stock_order=itemCount&stock_page=2&stock_q=abc",
      { scroll: false },
    );
  });

  it("pushes stock_date_from/stock_weight_max URL updates (page resets) when filters are applied", () => {
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.change(screen.getByLabelText("Data de entrada - de"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Peso restante - máximo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(push).toHaveBeenCalledWith(
      "/inventory?stock_date_from=2026-01-01&stock_weight_max=500",
      { scroll: false },
    );
  });

  it("preserves active filters (and drops page) when pagination is used after filtering", () => {
    currentSearchParams = new URLSearchParams(
      "stock_date_from=2026-01-01&stock_weight_max=500&stock_page=2",
    );
    render(
      <StockSection
        rows={[ROW]}
        total={45}
        query={{
          ...DEFAULT_QUERY,
          dateFrom: "2026-01-01",
          weightMax: "500",
          page: 2,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(push).toHaveBeenCalledWith(
      "/inventory?stock_date_from=2026-01-01&stock_page=3&stock_weight_max=500",
      { scroll: false },
    );
  });

  it("clears filters without clearing search when Limpar is used", () => {
    currentSearchParams = new URLSearchParams(
      "stock_q=abc&stock_date_from=2026-01-01&stock_weight_max=500",
    );
    render(
      <StockSection
        rows={[ROW]}
        total={1}
        query={{
          ...DEFAULT_QUERY,
          q: "abc",
          dateFrom: "2026-01-01",
          weightMax: "500",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    expect(push).toHaveBeenCalledWith("/inventory?stock_q=abc", {
      scroll: false,
    });
  });

  it("shows a status label reflecting the default order, with no filters-active marker", () => {
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    expect(
      screen.getByText(
        "Ordenado por Data de Entrada (desc) · somente visualização",
      ),
    ).toBeInTheDocument();
  });

  it("shows a status label reflecting a changed order/direction", () => {
    render(
      <StockSection
        rows={[ROW]}
        total={1}
        query={{ ...DEFAULT_QUERY, order: "nfWeight", dir: "asc" }}
      />,
    );

    expect(
      screen.getByText("Ordenado por Peso da NF (asc) · somente visualização"),
    ).toBeInTheDocument();
  });

  it("shows a filters-active marker in the status label when a filter is set", () => {
    render(
      <StockSection
        rows={[ROW]}
        total={1}
        query={{ ...DEFAULT_QUERY, weightMin: "10" }}
      />,
    );

    expect(
      screen.getByText(
        "Ordenado por Data de Entrada (desc) · filtros ativos · somente visualização",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the previous rows rendered and marks the region busy while a navigation is pending", async () => {
    vi.resetModules();
    vi.doMock("./use-stock-query-nav", () => ({
      useStockQueryNav: () => ({ navigateStock: push, isPending: true }),
    }));
    const { StockSection: PendingStockSection } = await import(
      "./stock-section"
    );

    render(<PendingStockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    expect(screen.getByRole("status")).toHaveTextContent("Atualizando…");
    // Stale rows stay mounted (no blank/loading swap) while pending.
    expect(screen.getAllByText("NF-001", { exact: false }).length).toBeGreaterThan(
      0,
    );
    const busyRegion = document.querySelector('[aria-busy="true"]');
    expect(busyRegion).not.toBeNull();

    vi.doUnmock("./use-stock-query-nav");
  });
});
