import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TopLoader } from "@/components/ui/top-loader";
import { NewLoadForm } from "./new-load-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/actions/loads", () => ({
  createLoad: vi.fn(),
}));

const MATERIALS = [
  { id: "mat-aco", name: "Aço" },
  { id: "mat-alu", name: "Alumínio" },
];

function fillDadosAndContinue() {
  fireEvent.change(screen.getByLabelText("Nota Fiscal"), {
    target: { value: "NF-123" },
  });
  fireEvent.change(screen.getByLabelText("Data e hora de entrada"), {
    target: { value: "2026-01-01T09:15" },
  });
  fireEvent.change(screen.getByLabelText("Peso da Nota Fiscal"), {
    target: { value: "100" },
  });
  fireEvent.change(screen.getByLabelText("Material"), {
    target: { value: "Aço" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Continuar para pesos" }),
  );
}

describe("NewLoadForm", () => {
  it("renders the NF-data fields with mono/unit treatment", () => {
    render(<NewLoadForm materials={MATERIALS} />);

    expect(screen.getByLabelText("Nota Fiscal").className).toMatch(
      /\bfont-mono\b/,
    );
    expect(screen.getByLabelText("Data e hora de entrada").className).toMatch(
      /\bfont-mono\b/,
    );
    expect(screen.getByLabelText("Peso da Nota Fiscal").className).toMatch(
      /\bfont-mono\b/,
    );
    expect(
      within(screen.getByTestId("load-form-dados-panel")).getByText("t"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Material").className).not.toMatch(
      /\bfont-mono\b/,
    );
  });

  it("renders the item count as a +/- stepper starting at 1, clamped to 1..20", () => {
    render(<NewLoadForm materials={MATERIALS} />);

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
    render(<NewLoadForm materials={MATERIALS} />);

    expect(screen.getAllByLabelText(/Peso do item \d+/).length).toBe(1);
  });

  it("generates one weight field per item when the stepper count changes", () => {
    render(<NewLoadForm materials={MATERIALS} />);

    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    fireEvent.click(increment);
    fireEvent.click(increment);
    fireEvent.click(increment);

    expect(screen.getAllByLabelText(/Peso do item \d+/)).toHaveLength(4);
  });

  it("shrinks the weight fields back down when the item count decreases", () => {
    render(<NewLoadForm materials={MATERIALS} />);

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
    render(<NewLoadForm materials={MATERIALS} />);

    const dadosPanel = screen.getByTestId("load-form-dados-panel");
    const pesosPanel = screen.getByTestId("load-form-pesos-panel");

    // Etapa 1: dados visible on mobile, pesos css-hidden on mobile (but present for md:)
    expect(dadosPanel.className).not.toMatch(/\bhidden\b/);
    expect(pesosPanel.className).toMatch(/\bhidden\b/);
    expect(pesosPanel.className).toMatch(/\bmd:flex\b/);
    expect(dadosPanel.className).toMatch(/\bmd:flex\b/);

    const cta = screen.getByRole("button", { name: "Continuar para pesos" });
    expect(cta.parentElement?.className).toMatch(/\bmd:hidden\b/);

    fillDadosAndContinue();

    expect(screen.getByTestId("load-form-dados-panel").className).toMatch(
      /\bhidden\b/,
    );
    expect(screen.getByTestId("load-form-pesos-panel").className).not.toMatch(
      /\bhidden\b/,
    );
  });

  it("defaults Data e hora de entrada to now on mount", () => {
    const now = new Date(2026, 6, 17, 14, 5);
    vi.useFakeTimers();
    vi.setSystemTime(now);

    render(<NewLoadForm materials={MATERIALS} />);

    expect(screen.getByLabelText("Data e hora de entrada")).toHaveValue(
      "2026-07-17T14:05",
    );

    vi.useRealTimers();
  });

  it("disables the mobile Continuar para pesos CTA until Nota Fiscal, Peso da Nota Fiscal, and Material are all valid", () => {
    render(<NewLoadForm materials={MATERIALS} />);

    const cta = screen.getByRole("button", { name: "Continuar para pesos" });
    expect(cta).toBeDisabled();
    expect(cta.className).toMatch(/disabled:opacity-50/);

    fireEvent.change(screen.getByLabelText("Nota Fiscal"), {
      target: { value: "NF-123" },
    });
    expect(cta).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Peso da Nota Fiscal"), {
      target: { value: "100" },
    });
    expect(cta).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Material"), {
      target: { value: "Aço" },
    });
    expect(cta).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Peso da Nota Fiscal"), {
      target: { value: "0" },
    });
    expect(cta).toBeDisabled();
  });

  it("treats Data e hora de entrada as required, even though it defaults to now", () => {
    render(<NewLoadForm materials={MATERIALS} />);

    fireEvent.change(screen.getByLabelText("Nota Fiscal"), {
      target: { value: "NF-123" },
    });
    fireEvent.change(screen.getByLabelText("Peso da Nota Fiscal"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Material"), {
      target: { value: "Aço" },
    });
    const cta = screen.getByRole("button", { name: "Continuar para pesos" });
    expect(cta).toBeEnabled();

    fireEvent.change(screen.getByLabelText("Data e hora de entrada"), {
      target: { value: "" },
    });
    expect(cta).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Data e hora de entrada"), {
      target: { value: "2026-01-01T09:00" },
    });
    expect(cta).toBeEnabled();
  });

  it("gives etapa-1 and etapa-2 inputs Portuguese placeholders and a decimal numeric keyboard on weight fields", () => {
    render(<NewLoadForm materials={MATERIALS} />);

    expect(screen.getByLabelText("Nota Fiscal")).toHaveAttribute(
      "placeholder",
      "000.000",
    );
    expect(screen.getByLabelText("Peso da Nota Fiscal")).toHaveAttribute(
      "placeholder",
      "0",
    );
    expect(screen.getByLabelText("Peso da Nota Fiscal")).toHaveAttribute(
      "inputMode",
      "decimal",
    );
    expect(screen.getByLabelText("Material")).toHaveAttribute(
      "placeholder",
      "Ex: Sucata de Alumínio",
    );

    fillDadosAndContinue();

    const item1 = screen.getByLabelText("Peso do item 1");
    expect(item1).toHaveAttribute("placeholder", "0");
    expect(item1).toHaveAttribute("inputMode", "decimal");
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

    const { container } = render(<NewLoadForm materials={MATERIALS} />);
    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    fireEvent.click(increment);

    fireEvent.change(screen.getByLabelText("Nota Fiscal"), {
      target: { value: "NF-1" },
    });
    fireEvent.change(screen.getByLabelText("Data e hora de entrada"), {
      target: { value: "2026-01-01T09:00" },
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
    const item2Group = screen
      .getByLabelText("Peso do item 2")
      .closest('[data-testid^="pesos-item-"]');
    const item1Group = screen
      .getByLabelText("Peso do item 1")
      .closest('[data-testid^="pesos-item-"]');

    expect(item2Group?.contains(error)).toBe(true);
    expect(item1Group?.contains(error)).toBe(false);
  });

  it("shows an NF context chip with the NF number and material above the weights grid", () => {
    render(<NewLoadForm materials={MATERIALS} />);
    fillDadosAndContinue();

    const chip = screen.getByTestId("pesos-nf-chip");
    expect(chip).toHaveTextContent("NF-123");
    expect(chip).toHaveTextContent("Aço");
  });

  it("renders the weight inputs in a grid sized to itemCount (2 cols mobile / 4 cols md) with an Item N label and t suffix", () => {
    render(<NewLoadForm materials={MATERIALS} />);
    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    fireEvent.click(increment);
    fireEvent.click(increment);
    fireEvent.click(increment);
    fillDadosAndContinue();

    const grid = screen.getByTestId("pesos-weights-grid");
    expect(grid.className).toMatch(/\bgrid-cols-2\b/);
    expect(grid.className).toMatch(/\bmd:grid-cols-4\b/);
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 4")).toBeInTheDocument();

    const item1 = screen.getByLabelText("Peso do item 1");
    expect(item1.className).toMatch(/\bfont-mono\b/);
    expect(item1.closest("div")?.textContent).toMatch(/\bt\b/);
  });

  it("shows a live Peso Restante vs Peso da NF summary with a fill-progress bar, recomputed on each keystroke", () => {
    render(<NewLoadForm materials={MATERIALS} />);
    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    fireEvent.click(increment);
    fillDadosAndContinue();

    expect(screen.getByTestId("pesos-remaining-weight")).toHaveTextContent(
      "0",
    );
    expect(screen.getByTestId("pesos-nf-weight")).toHaveTextContent("100");

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "0");

    fireEvent.change(screen.getByLabelText("Peso do item 1"), {
      target: { value: "30" },
    });

    expect(screen.getByTestId("pesos-remaining-weight")).toHaveTextContent(
      "30",
    );
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");

    fireEvent.change(screen.getByLabelText("Peso do item 2"), {
      target: { value: "20" },
    });

    expect(screen.getByTestId("pesos-remaining-weight")).toHaveTextContent(
      "50",
    );
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("disables the primary CTA until all weights are entered, and labels it with the item count", () => {
    render(<NewLoadForm materials={MATERIALS} />);
    const increment = screen.getByRole("button", {
      name: "Aumentar quantidade de itens",
    });
    fireEvent.click(increment);
    fillDadosAndContinue();

    const submitCtas = screen.getAllByRole("button", {
      name: "Criar carga e gerar 2 QR Codes",
    });
    expect(submitCtas.length).toBeGreaterThan(0);
    for (const cta of submitCtas) expect(cta).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Peso do item 1"), {
      target: { value: "30" },
    });
    for (const cta of submitCtas) expect(cta).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Peso do item 2"), {
      target: { value: "20" },
    });
    for (const cta of submitCtas) expect(cta).toBeEnabled();
  });

  it("activates the TopLoader and swaps the submit label to Criando… while the create-load transition is pending", async () => {
    const { createLoad } = await import("@/lib/actions/loads");
    let resolveCreateLoad: (value: unknown) => void = () => {};
    vi.mocked(createLoad).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreateLoad = resolve;
        }) as never,
    );

    render(
      <>
        <TopLoader />
        <NewLoadForm materials={MATERIALS} />
      </>,
    );
    fillDadosAndContinue();
    fireEvent.change(screen.getByLabelText("Peso do item 1"), {
      target: { value: "100" },
    });

    const submitCtas = screen.getAllByRole("button", {
      name: "Criar carga e gerar 1 QR Codes",
    });
    fireEvent.click(submitCtas[0]);

    await waitFor(() => {
      expect(
        screen.getByRole("progressbar", { name: "Carregando" }),
      ).toBeInTheDocument();
    });
    for (const cta of screen.getAllByRole("button", { name: "Criando…" })) {
      expect(cta).toBeDisabled();
    }

    resolveCreateLoad({ success: true, load: { id: "load-1" } });

    await waitFor(() => {
      expect(
        screen.queryByRole("progressbar", { name: "Carregando" }),
      ).not.toBeInTheDocument();
    });
  });
});
