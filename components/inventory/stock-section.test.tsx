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
  nfWeight: "1.000,00 kg",
  material: "Sucata",
  itemCount: 4,
  remainingWeight: "250,00 kg",
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

    expect(push).toHaveBeenCalledWith("/inventory?stock_q=NF-2");
    vi.useRealTimers();
  });

  it("pushes a stock_order/stock_dir URL update when an order option is picked", () => {
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Ordenar" })[1]);
    const nfWeightLabel = screen
      .getAllByText("Peso da NF")
      .find((el) => el.closest("fieldset"))!;
    fireEvent.click(
      nfWeightLabel.closest("div")!.querySelectorAll("button")[0],
    );

    expect(push).toHaveBeenCalledWith(
      "/inventory?stock_dir=asc&stock_order=nfWeight",
    );
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
    );
  });

  it("pushes stock_date_from/stock_weight_max URL updates (page resets) when filters are applied", () => {
    render(<StockSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Filtros" })[1]);
    fireEvent.change(screen.getByLabelText("Data de entrada - de"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Peso restante - máximo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(push).toHaveBeenCalledWith(
      "/inventory?stock_date_from=2026-01-01&stock_weight_max=500",
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
    );
  });

  it("clears filters without clearing search when Limpar filtros is used", () => {
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

    fireEvent.click(screen.getAllByRole("button", { name: "Filtros (2)" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(push).toHaveBeenCalledWith("/inventory?stock_q=abc");
  });
});
