import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StockPagination } from "./stock-pagination";

describe("StockPagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(
      <StockPagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page and total pages", () => {
    render(<StockPagination page={2} totalPages={5} onPageChange={vi.fn()} />);

    expect(screen.getByText("Página 2 de 5")).toBeInTheDocument();
  });

  it("disables Anterior on the first page and Próxima on the last page", () => {
    const { rerender } = render(
      <StockPagination page={1} totalPages={3} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeEnabled();

    rerender(<StockPagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("calls onPageChange with the adjacent page number", () => {
    const onPageChange = vi.fn();
    render(<StockPagination page={2} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });
});
