import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { createMaterialAction, renameMaterialAction } = vi.hoisted(() => ({
  createMaterialAction: vi.fn(),
  renameMaterialAction: vi.fn(),
}));
vi.mock("@/lib/actions/materials", () => ({
  createMaterialAction,
  renameMaterialAction,
}));

import { MaterialsView } from "./materials-view";

const MATERIALS = [
  { id: "mat-1", name: "Alumínio", inStockCount: 3 },
  { id: "mat-2", name: "Cobre", inStockCount: 0 },
];

describe("MaterialsView", () => {
  it("lists every material with its in-stock count, including zero", () => {
    render(<MaterialsView materials={MATERIALS} />);

    expect(screen.getByText("Alumínio")).toBeInTheDocument();
    expect(screen.getByText("Cobre")).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it("shows an empty state when there are no materials", () => {
    render(<MaterialsView materials={[]} />);

    expect(screen.getByText(/nenhum material/i)).toBeInTheDocument();
  });

  it("opens the add-material dialog when 'Adicionar material' is clicked", () => {
    render(<MaterialsView materials={MATERIALS} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Adicionar material" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("adds a material and updates the list on success", async () => {
    createMaterialAction.mockResolvedValue({
      success: true,
      material: { id: "mat-3", name: "Bronze" },
    });
    render(<MaterialsView materials={MATERIALS} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar material" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Bronze" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(screen.getByText("Bronze")).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a Portuguese error and keeps the dialog open when the name is a duplicate", async () => {
    createMaterialAction.mockResolvedValue({
      success: false,
      error: { formErrors: [], fieldErrors: { name: ["duplicate"] } },
    });
    render(<MaterialsView materials={MATERIALS} />);

    fireEvent.click(screen.getByRole("button", { name: "Adicionar material" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Alumínio" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(
        screen.getByText("Já existe um material com esse nome."),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens an edit dialog pre-filled with the material's current name", () => {
    render(<MaterialsView materials={MATERIALS} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Alumínio");
  });

  it("renames a material and updates the list on success", async () => {
    renameMaterialAction.mockResolvedValue({
      success: true,
      material: { id: "mat-1", name: "Alumínio Puro" },
    });
    render(<MaterialsView materials={MATERIALS} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Alumínio Puro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(screen.getByText("Alumínio Puro")).toBeInTheDocument();
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
