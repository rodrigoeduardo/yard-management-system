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
  it("renders the NF-data fields with mono/unit treatment", () => {
    render(<NewLoadPage />);

    expect(screen.getByLabelText("Nota Fiscal").className).toMatch(
      /\bfont-mono\b/,
    );
    expect(screen.getByLabelText("Data de Entrada").className).toMatch(
      /\bfont-mono\b/,
    );
    expect(screen.getByLabelText("Peso da Nota Fiscal").className).toMatch(
      /\bfont-mono\b/,
    );
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByLabelText("Material").className).not.toMatch(
      /\bfont-mono\b/,
    );
  });

  it("renders the item count as a +/- stepper starting at 1, clamped to 1..20", () => {
    render(<NewLoadPage />);

    const group = screen.getByRole("group", { name: "Quantidade de Itens" });
    expect(group).toHaveTextContent("1");

    const decrement = screen.getByRole("button", {
      name: "Diminuir quantidade de itens",
    });
    expect(decrement).toBeDisabled();

    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    for (let i = 0; i < 25; i++) {
      fireEvent.click(increment);
    }
    expect(group).toHaveTextContent("20");
    expect(increment).toBeDisabled();
  });

  it("renders one per-item weight field by default", () => {
    render(<NewLoadPage />);

    expect(screen.getAllByLabelText(/Peso do item \d+/).length).toBe(1);
  });

  it("generates one weight field per item when the stepper count changes", () => {
    render(<NewLoadPage />);

    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    fireEvent.click(increment);
    fireEvent.click(increment);
    fireEvent.click(increment);

    expect(screen.getAllByLabelText(/Peso do item \d+/)).toHaveLength(4);
  });

  it("shrinks the weight fields back down when the item count decreases", () => {
    render(<NewLoadPage />);

    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    const decrement = screen.getByRole("button", {
      name: "Diminuir quantidade de itens",
    });
    fireEvent.click(increment);
    fireEvent.click(increment);
    expect(screen.getAllByLabelText(/Peso do item \d+/)).toHaveLength(3);

    fireEvent.click(decrement);
    expect(screen.getAllByLabelText(/Peso do item \d+/)).toHaveLength(2);
  });

  it("mobile base: shows Etapa 1 with a sticky Continuar CTA that advances to the weights step", () => {
    render(<NewLoadPage />);

    const dadosPanel = screen.getByTestId("load-form-dados-panel");
    const pesosPanel = screen.getByTestId("load-form-pesos-panel");

    // Etapa 1: dados visible on mobile, pesos css-hidden on mobile (but present for md:)
    expect(dadosPanel.className).not.toMatch(/\bhidden\b/);
    expect(pesosPanel.className).toMatch(/\bhidden\b/);
    expect(pesosPanel.className).toMatch(/\bmd:flex\b/);
    expect(dadosPanel.className).toMatch(/\bmd:flex\b/);

    const cta = screen.getByRole("button", { name: "Continuar para pesos" });
    expect(cta.parentElement?.className).toMatch(/\bmd:hidden\b/);

    fireEvent.click(cta);

    expect(screen.getByTestId("load-form-dados-panel").className).toMatch(
      /\bhidden\b/,
    );
    expect(screen.getByTestId("load-form-pesos-panel").className).not.toMatch(
      /\bhidden\b/,
    );
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
    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    fireEvent.click(increment);

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

    fireEvent.click(
      screen.getByRole("button", { name: "Continuar para pesos" }),
    );

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
