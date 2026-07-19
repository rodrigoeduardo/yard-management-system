import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StockOrderControl } from "./stock-order-control";

describe("StockOrderControl", () => {
  it("renders a mobile trigger hidden at md: and a desktop trigger hidden below md:", () => {
    render(<StockOrderControl order="entryDate" dir="desc" onChange={vi.fn()} />);

    const triggers = screen.getAllByRole("button", { name: "Ordenar" });
    expect(triggers).toHaveLength(2);
    expect(triggers[0].closest("div")?.className).toMatch(/\bmd:hidden\b/);
    expect(triggers[1].closest("div")?.className).toMatch(/\bmd:block\b/);
  });

  it("opens a dialog with order options when the mobile trigger is clicked", () => {
    render(<StockOrderControl order="entryDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Ordenar" })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Peso da NF")).toBeInTheDocument();
  });

  it("calls onChange and closes the dialog when an option is picked on mobile", () => {
    const onChange = vi.fn();
    render(<StockOrderControl order="entryDate" dir="desc" onChange={onChange} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Ordenar" })[0]);
    fireEvent.click(
      screen
        .getByText("Peso da NF")
        .closest("div")!
        .querySelector("button")!,
    );

    expect(onChange).toHaveBeenCalledWith("nfWeight", "asc");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("expands an inline panel (no dialog) when the desktop trigger is clicked", () => {
    render(<StockOrderControl order="entryDate" dir="desc" onChange={vi.fn()} />);

    const desktopTrigger = screen.getAllByRole("button", { name: "Ordenar" })[1];
    expect(desktopTrigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Peso da NF")).not.toBeInTheDocument();

    fireEvent.click(desktopTrigger);

    expect(desktopTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Peso da NF")).toBeInTheDocument();
  });
});
