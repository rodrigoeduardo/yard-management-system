import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NewLoadPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/actions/loads", () => ({
  createLoad: vi.fn(),
}));

describe("NewLoadPage", () => {
  it("renders one per-item weight field by default", () => {
    render(<NewLoadPage />);

    expect(
      screen.getAllByLabelText(/Peso do item \d+/).length,
    ).toBe(1);
  });

  it("generates one weight field per item when the item count changes", () => {
    render(<NewLoadPage />);

    const itemCount = screen.getByLabelText("Quantidade de Itens");
    fireEvent.change(itemCount, { target: { value: "4" } });

    expect(screen.getAllByLabelText(/Peso do item \d+/)).toHaveLength(4);
  });

  it("shrinks the weight fields back down when the item count decreases", () => {
    render(<NewLoadPage />);

    const itemCount = screen.getByLabelText("Quantidade de Itens");
    fireEvent.change(itemCount, { target: { value: "3" } });
    expect(screen.getAllByLabelText(/Peso do item \d+/)).toHaveLength(3);

    fireEvent.change(itemCount, { target: { value: "2" } });
    expect(screen.getAllByLabelText(/Peso do item \d+/)).toHaveLength(2);
  });

  it("shows an item-weight error next to the specific invalid item's input", async () => {
    const { createLoad } = await import("@/lib/actions/loads");
    vi.mocked(createLoad).mockResolvedValue({
      success: false,
      error: {
        formErrors: [],
        fieldErrors: {},
        itemWeightErrors: { 1: ["Number must be greater than 0"] },
      },
    });

    const { container } = render(<NewLoadPage />);
    fireEvent.change(screen.getByLabelText("Quantidade de Itens"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Nota Fiscal"), {
      target: { value: "NF-1" },
    });
    fireEvent.change(screen.getByLabelText("Data de Entrada"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Peso da Nota Fiscal"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Material"), {
      target: { value: "Aço" },
    });
    fireEvent.change(screen.getByLabelText("Peso do item 1"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Peso do item 2"), {
      target: { value: "0" },
    });

    fireEvent.submit(container.querySelector("form")!);

    const error = await screen.findByText(
      "Informe um peso válido para o item 2.",
    );
    const item2Group = screen.getByLabelText("Peso do item 2").parentElement;
    const item1Group = screen.getByLabelText("Peso do item 1").parentElement;

    expect(item2Group?.contains(error)).toBe(true);
    expect(item1Group?.contains(error)).toBe(false);
  });
});
