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
});
