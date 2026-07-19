import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RemovalOrderControl } from "./removal-order-control";

describe("RemovalOrderControl", () => {
  it("renders a single icon trigger identified by its aria-label", () => {
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Ordenar" })).toBeInTheDocument();
  });

  it("opens a modal with order options when the trigger is clicked", () => {
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Qtd. de Itens")).toBeInTheDocument();
  });

  it("calls onChange and closes the modal when an option is picked", () => {
    const onChange = vi.fn();
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Ordenar" }));
    fireEvent.click(
      screen.getByText("Qtd. de Itens").closest("div")!.querySelector("button")!,
    );

    expect(onChange).toHaveBeenCalledWith("itemCount", "asc");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows no active-order badge for the default order/direction", () => {
    render(<RemovalOrderControl order="exitDate" dir="desc" onChange={vi.fn()} />);

    expect(screen.queryByText("1")).not.toBeInTheDocument();
  });

  it("shows an active-order badge when order or direction differs from the default", () => {
    render(<RemovalOrderControl order="itemCount" dir="asc" onChange={vi.fn()} />);

    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
