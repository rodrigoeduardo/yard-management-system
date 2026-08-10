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
  { id: "mat-1", name: "Alumínio", inStockCount: 3, inStockWeight: "10.000" },
  { id: "mat-2", name: "Cobre", inStockCount: 0, inStockWeight: "0" },
];

describe("MaterialsView", () => {
  it("lists every material with its in-stock count and weight, including zero", () => {
    render(<MaterialsView materials={MATERIALS} />);

    expect(screen.getByText("Alumínio")).toBeInTheDocument();
    expect(screen.getByText("Cobre")).toBeInTheDocument();
    expect(screen.getByText("3 und. · 10.000 Ton em estoque")).toBeInTheDocument();
    expect(screen.getByText("0 und. · 0 Ton em estoque")).toBeInTheDocument();
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

  it("hides Adicionar material and Editar for a viewer session, keeping counts visible (issue #314)", () => {
    render(<MaterialsView materials={MATERIALS} isViewer />);

    expect(
      screen.queryByRole("button", { name: "Adicionar material" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Alumínio")).toBeInTheDocument();
    expect(screen.getByText("3 und. · 10.000 Ton em estoque")).toBeInTheDocument();
  });

  it("shows the add/edit controls for an operator session by default", () => {
    render(<MaterialsView materials={MATERIALS} />);

    expect(
      screen.getByRole("button", { name: "Adicionar material" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(2);
  });
});
