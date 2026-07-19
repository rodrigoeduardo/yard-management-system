import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RemovalQueryState } from "@/lib/inventory/removal-query";
import { RemovalSection } from "./removal-section";
import type { RemovalLogRow } from "./removal-log-table";

const push = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/inventory",
  useSearchParams: () => currentSearchParams,
}));

const ROW: RemovalLogRow = {
  id: "r1",
  exitDate: "02/01/2026",
  driver: "João",
  totalRemovedWeight: "100,00 kg",
  notasFiscais: "NF-001",
  itemCount: 3,
};

const DEFAULT_QUERY: RemovalQueryState = {
  q: "",
  order: "exitDate",
  dir: "desc",
  page: 1,
};

beforeEach(() => {
  push.mockClear();
  currentSearchParams = new URLSearchParams();
});

describe("RemovalSection", () => {
  it("renders the empty state with no rows and no search", () => {
    render(<RemovalSection rows={[]} total={0} query={DEFAULT_QUERY} />);

    expect(
      screen.getByText("Nenhuma remoção registrada ainda."),
    ).toBeInTheDocument();
  });

  it("renders a friendly no-results empty state when a search yields no rows", () => {
    render(
      <RemovalSection
        rows={[]}
        total={0}
        query={{ ...DEFAULT_QUERY, q: "abc" }}
      />,
    );

    expect(
      screen.getByText("Nenhuma remoção encontrada para essa busca."),
    ).toBeInTheDocument();
  });

  it("renders a mobile card list hidden at md: and a desktop table hidden below md:", () => {
    render(<RemovalSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    const occurrences = screen.getAllByText("João");
    expect(occurrences).toHaveLength(2);

    const cardList = occurrences[0].closest('[data-slot="card"]')?.parentElement;
    expect(cardList?.className).toMatch(/\bmd:hidden\b/);

    const tableWrapper = occurrences[1].closest(
      '[data-slot="table-container"]',
    )?.parentElement?.parentElement;
    expect(tableWrapper?.className).toMatch(/\bhidden\b/);
    expect(tableWrapper?.className).toMatch(/\bmd:block\b/);
  });

  it("pushes a rem_q URL update when the search input debounces (page resets)", () => {
    vi.useFakeTimers();
    render(<RemovalSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Joao" },
    });
    vi.advanceTimersByTime(300);

    expect(push).toHaveBeenCalledWith("/inventory?rem_q=Joao");
    vi.useRealTimers();
  });

  it("pushes a rem_order/rem_dir URL update when an order option is picked", () => {
    render(<RemovalSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Ordenar" })[1]);
    const itemCountLabel = screen
      .getAllByText("Qtd. de Itens")
      .find((el) => el.closest("fieldset"))!;
    fireEvent.click(
      itemCountLabel.closest("div")!.querySelectorAll("button")[0],
    );

    expect(push).toHaveBeenCalledWith(
      "/inventory?rem_dir=asc&rem_order=itemCount",
    );
  });

  it("pushes a rem_page URL update, preserving q/order, when navigating pages", () => {
    currentSearchParams = new URLSearchParams(
      "rem_q=abc&rem_order=itemCount&rem_dir=asc",
    );
    render(
      <RemovalSection
        rows={[ROW]}
        total={45}
        query={{ q: "abc", order: "itemCount", dir: "asc", page: 1 }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(push).toHaveBeenCalledWith(
      "/inventory?rem_dir=asc&rem_order=itemCount&rem_page=2&rem_q=abc",
    );
  });

  it("pushes rem_date_from/rem_weight_max URL updates (page resets) when filters are applied", () => {
    render(<RemovalSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Filtros" })[1]);
    fireEvent.change(screen.getByLabelText("Data de saída - de"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Peso total removido - máximo"), {
      target: { value: "500" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(push).toHaveBeenCalledWith(
      "/inventory?rem_date_from=2026-01-01&rem_weight_max=500",
    );
  });

  it("preserves active filters (and drops page) when pagination is used after filtering", () => {
    currentSearchParams = new URLSearchParams(
      "rem_date_from=2026-01-01&rem_weight_max=500&rem_page=2",
    );
    render(
      <RemovalSection
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
      "/inventory?rem_date_from=2026-01-01&rem_page=3&rem_weight_max=500",
    );
  });

  it("clears filters without clearing search when Limpar filtros is used", () => {
    currentSearchParams = new URLSearchParams(
      "rem_q=abc&rem_date_from=2026-01-01&rem_weight_max=500",
    );
    render(
      <RemovalSection
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

    expect(push).toHaveBeenCalledWith("/inventory?rem_q=abc");
  });

  it("does not render pagination for a single page", () => {
    render(<RemovalSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    expect(
      screen.queryByRole("navigation", { name: "Paginação de remoções" }),
    ).not.toBeInTheDocument();
  });

  it("preserves an unrelated stock_* param untouched when navigating rem_* state", () => {
    currentSearchParams = new URLSearchParams("stock_q=steel&stock_page=4");
    render(<RemovalSection rows={[ROW]} total={1} query={DEFAULT_QUERY} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Ordenar" })[1]);
    const exitDateLabel = screen
      .getAllByText("Data de Saída")
      .find((el) => el.closest("fieldset"))!;
    fireEvent.click(
      exitDateLabel.closest("div")!.querySelectorAll("button")[0],
    );

    expect(push).toHaveBeenCalledWith(
      "/inventory?rem_dir=asc&stock_page=4&stock_q=steel",
    );
  });
});
