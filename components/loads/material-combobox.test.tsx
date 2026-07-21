import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MaterialCombobox } from "./material-combobox";

const MATERIALS = [
  { id: "mat-aco", name: "Aço" },
  { id: "mat-alu", name: "Alumínio" },
  { id: "mat-cobre", name: "Cobre" },
];

function setup(overrides?: { value?: string; displayValue?: string }) {
  const onChange = vi.fn();
  render(
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
  return { onChange };
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
});
