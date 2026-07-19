import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StockOrderControl } from "./stock-order-control";

describe("StockOrderControl", () => {
  it("renders a single icon trigger identified by its aria-label", () => {
    render(<StockOrderControl order="entryDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Ordenar" })).toBeInTheDocument();
  });

  it("opens a modal with order options when the trigger is clicked", () => {
    render(<StockOrderControl order="entryDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Peso da NF")).toBeInTheDocument();
  });

  it("calls onChange and closes the modal when an option is picked", () => {
    const onChange = vi.fn();
    render(<StockOrderControl order="entryDate" dir="desc" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    fireEvent.click(
      screen.getByText("Peso da NF").closest("div")!.querySelector("button")!,
    );

    expect(onChange).toHaveBeenCalledWith("nfWeight", "asc");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows no active-order badge for the default order/direction", () => {
    render(<StockOrderControl order="entryDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("shows an active-order badge when order or direction differs from the default", () => {
    render(<StockOrderControl order="nfWeight" dir="asc" onChange={vi.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
