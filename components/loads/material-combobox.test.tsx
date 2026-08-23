import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MaterialCombobox } from "./material-combobox";

const MATERIALS = [
  { id: "mat-aco", name: "Aço" },
  { id: "mat-alu", name: "Alumínio" },
  { id: "mat-cobre", name: "Cobre" },
];

/**
 * MaterialCombobox decides desktop-popover vs. mobile-sheet presentation via
 * `window.matchMedia("(max-width: 767px)")` (see material-combobox.tsx for
 * why this is a guarded JS check rather than pure CSS). jsdom has no
 * `matchMedia`, so the component's own guard treats an unmocked environment
 * as desktop — this stub is only needed for the mobile-sheet tests below.
 */
function mockViewport(matches: boolean) {
  const listeners = new Set<() => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query === "(max-width: 767px)" ? matches : false,
    media: query,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  // @ts-expect-error -- test-only cleanup of the mock installed above
  delete window.matchMedia;
});

function setup(overrides?: { value?: string; displayValue?: string }) {
  const onChange = vi.fn();
  const view = render(
    <MaterialCombobox
      id="material"
      materials={MATERIALS}
      value={overrides?.value ?? ""}
      displayValue={overrides?.displayValue ?? ""}
      onChange={onChange}
      placeholder="Ex: Sucata de Alumínio"
      required
    />,
  );
  return { onChange, unmount: view.unmount };
}

/**
 * The mobile sheet is composed from `components/ui/dialog.tsx`, whose popup
 * carries `data-slot="dialog-content"` — a more precise handle than
 * `role="dialog"`, since Base UI's Popover popup (the desktop presentation)
 * is *also* exposed as `role="dialog"`.
 */
function querySheet(): HTMLElement | null {
  return document.querySelector('[data-slot="dialog-content"]');
}

describe("MaterialCombobox", () => {
  it("renders a labeled text field", () => {
    render(
      <>
        <label htmlFor="material">Material</label>
        <MaterialCombobox
          id="material"
          materials={MATERIALS}
          value=""
          displayValue=""
          onChange={vi.fn()}
        />
      </>,
    );

    expect(screen.getByLabelText("Material")).toBeInTheDocument();
  });

  it("filters the options list as the user types", () => {
    setup();
    const field = screen.getByRole("combobox");

    fireEvent.change(field, { target: { value: "al" } });

    const list = screen.getByRole("listbox");
    expect(within(list).getByText("Alumínio")).toBeInTheDocument();
    expect(within(list).queryByText("Aço")).not.toBeInTheDocument();
    expect(within(list).queryByText("Cobre")).not.toBeInTheDocument();
  });

  it("shows an Adicionar option at the top of the list while typing, even when there are matches", () => {
    setup();
    const field = screen.getByRole("combobox");

    fireEvent.change(field, { target: { value: "Alu" } });

    const list = screen.getByRole("listbox");
    const options = within(list).getAllByRole("option");
    expect(options[0]).toHaveTextContent('Adicionar "Alu"');
    expect(options.some((o) => o.textContent === "Alumínio")).toBe(true);
  });

  it("shows the Adicionar option as the only result when typed text matches no material", () => {
    setup();
    const field = screen.getByRole("combobox");

    fireEvent.change(field, { target: { value: "Titânio" } });

    const list = screen.getByRole("listbox");
    const options = within(list).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Adicionar "Titânio"');
  });

  it("does not show an Adicionar option when the field is empty", () => {
    setup();
    const field = screen.getByRole("combobox");
    fireEvent.focus(field);

    expect(screen.queryByText(/Adicionar/)).not.toBeInTheDocument();
  });

  it("calls onChange with the raw typed text as both value and display on every keystroke", () => {
    const { onChange } = setup();
    const field = screen.getByRole("combobox");

    fireEvent.change(field, { target: { value: "Aço Inox" } });

    expect(onChange).toHaveBeenCalledWith("Aço Inox", "Aço Inox");
  });

  it("selecting an existing material option stages its id as the value and its name as the display", () => {
    const { onChange } = setup();
    const field = screen.getByRole("combobox");
    fireEvent.change(field, { target: { value: "Alu" } });

    fireEvent.click(screen.getByRole("option", { name: "Alumínio" }));

    expect(onChange).toHaveBeenLastCalledWith("mat-alu", "Alumínio");
    expect(field).toHaveValue("Alumínio");
  });

  it("selecting the Adicionar option stages the trimmed typed name as both value and display", () => {
    const { onChange } = setup();
    const field = screen.getByRole("combobox");
    fireEvent.change(field, { target: { value: "  Titânio  " } });

    fireEvent.click(screen.getByRole("option", { name: 'Adicionar "Titânio"' }));

    expect(onChange).toHaveBeenLastCalledWith("Titânio", "Titânio");
    expect(field).toHaveValue("Titânio");
  });

  it("closes the options list after selecting an option", () => {
    setup();
    const field = screen.getByRole("combobox");
    fireEvent.change(field, { target: { value: "Alu" } });
    fireEvent.click(screen.getByRole("option", { name: "Alumínio" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("initializes the field text from displayValue", () => {
    setup({ value: "mat-cobre", displayValue: "Cobre" });

    expect(screen.getByRole("combobox")).toHaveValue("Cobre");
  });

  it("caps the visible options list at 15 items", () => {
    const manyMaterials = Array.from({ length: 30 }, (_, i) => ({
      id: `mat-${i}`,
      name: `Material ${i}`,
    }));
    const onChange = vi.fn();
    render(
      <MaterialCombobox
        id="material"
        materials={manyMaterials}
        value=""
        displayValue=""
        onChange={onChange}
      />,
    );
    const field = screen.getByRole("combobox");

    fireEvent.focus(field);

    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option")).toHaveLength(15);
  });
});

describe("MaterialCombobox mobile sheet", () => {
  it("opens a sheet with its own search input and the option list when the field is tapped", () => {
    mockViewport(true);
    setup();
    const field = screen.getByRole("combobox");

    fireEvent.click(field);
    fireEvent.focus(field);

    const sheet = querySheet();
    expect(sheet).toBeInTheDocument();
    expect(within(sheet!).getByRole("combobox")).toBeInTheDocument();
    const list = screen.getByRole("listbox");
    expect(within(list).getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("does not let the field itself be edited (avoids raising the native keyboard)", () => {
    mockViewport(true);
    setup();
    const field = screen.getByRole("combobox");

    expect(field).toHaveAttribute("readonly");
  });

  it("filters the sheet's option list by the sheet's own search input, case-insensitively, capped at 15", () => {
    mockViewport(true);
    setup();
    fireEvent.focus(screen.getByRole("combobox"));

    const sheet = querySheet()!;
    const sheetSearch = within(sheet).getByRole("combobox");
    fireEvent.change(sheetSearch, { target: { value: "AÇ" } });

    const list = within(sheet).getByRole("listbox");
    const options = within(list).getAllByRole("option");
    expect(options.some((o) => o.textContent === "Aço")).toBe(true);
    expect(options.some((o) => o.textContent === "Alumínio")).toBe(false);
    expect(options.some((o) => o.textContent === "Cobre")).toBe(false);
  });

  it("selecting an option in the sheet closes it and stages the id/name exactly as the desktop popover does", () => {
    mockViewport(true);
    const { onChange } = setup();
    fireEvent.focus(screen.getByRole("combobox"));

    const sheet = querySheet()!;
    const sheetSearch = within(sheet).getByRole("combobox");
    fireEvent.change(sheetSearch, { target: { value: "Alu" } });
    fireEvent.click(within(sheet).getByRole("option", { name: "Alumínio" }));

    expect(onChange).toHaveBeenLastCalledWith("mat-alu", "Alumínio");
    expect(screen.getByRole("combobox")).toHaveValue("Alumínio");
    expect(querySheet()).not.toBeInTheDocument();
  });

  it("keeps find-or-create: dismissing the sheet on an unmatched name retains the typed name as the submission value", () => {
    mockViewport(true);
    const { onChange } = setup();
    fireEvent.focus(screen.getByRole("combobox"));

    const sheet = querySheet()!;
    const sheetSearch = within(sheet).getByRole("combobox");
    fireEvent.change(sheetSearch, { target: { value: "Titânio" } });
    fireEvent.keyDown(sheet, { key: "Escape" });

    expect(onChange).toHaveBeenLastCalledWith("Titânio", "Titânio");
  });

  it("closes on Escape and restores focus to the field it opened from", async () => {
    mockViewport(true);
    setup();
    const field = screen.getByRole("combobox");
    fireEvent.focus(field);

    fireEvent.keyDown(querySheet()!, { key: "Escape" });

    await waitFor(() => {
      expect(querySheet()).not.toBeInTheDocument();
    });
    expect(field).toHaveFocus();
  });

  it("closes on a visible dismiss button", async () => {
    mockViewport(true);
    setup();
    fireEvent.focus(screen.getByRole("combobox"));

    fireEvent.click(screen.getByRole("button", { name: /fechar|close/i }));

    await waitFor(() => {
      expect(querySheet()).not.toBeInTheDocument();
    });
  });

  it("does not leak open state between independent field instances", () => {
    mockViewport(true);
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    render(
      <>
        <MaterialCombobox
          id="material-a"
          materials={MATERIALS}
          value=""
          displayValue=""
          onChange={onChangeA}
        />
        <MaterialCombobox
          id="material-b"
          materials={MATERIALS}
          value=""
          displayValue=""
          onChange={onChangeB}
        />
      </>,
    );
    const [fieldA, fieldB] = screen.getAllByRole("combobox");

    fireEvent.focus(fieldA);

    expect(document.querySelectorAll('[data-slot="dialog-content"]')).toHaveLength(1);
    expect(fieldB).not.toHaveAttribute("aria-expanded", "true");
  });

  it("releases the document scroll lock when the sheet unmounts while open", async () => {
    mockViewport(true);
    const { unmount } = setup();
    fireEvent.focus(screen.getByRole("combobox"));
    expect(querySheet()).toBeInTheDocument();

    unmount();

    await waitFor(() => {
      expect(
        document.documentElement.hasAttribute("data-base-ui-scroll-locked"),
      ).toBe(false);
    });
  });

  it("leaves the desktop popover behavior unchanged at md and above", () => {
    mockViewport(false);
    setup();
    const field = screen.getByRole("combobox");

    fireEvent.change(field, { target: { value: "al" } });

    expect(querySheet()).not.toBeInTheDocument();
    const list = screen.getByRole("listbox");
    expect(within(list).getByText("Alumínio")).toBeInTheDocument();
  });
});
