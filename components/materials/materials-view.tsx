"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  createMaterialAction,
  renameMaterialAction,
} from "@/lib/actions/materials";
import { formatWeight } from "@/lib/format/weight";
import { mapMaterialFieldErrors } from "@/lib/forms/material-error-map";
import {
  MaterialFormDialog,
  type MaterialFormResult,
} from "./material-form-dialog";

export type MaterialRow = {
  id: string;
  name: string;
  inStockCount: number;
  inStockWeight: string;
};

function sortByName(rows: MaterialRow[]): MaterialRow[] {
  return [...rows].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

const GENERIC_ADD_ERROR = "Não foi possível adicionar o material.";
const GENERIC_RENAME_ERROR = "Não foi possível salvar o material.";

export function MaterialsView({ materials }: { materials: MaterialRow[] }) {
  const [rows, setRows] = useState<MaterialRow[]>(materials);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<MaterialRow | null>(null);

  async function handleAdd(name: string): Promise<MaterialFormResult> {
    const result = await createMaterialAction({ name });
    if (!result.success) {
      const messages = mapMaterialFieldErrors(result.error.fieldErrors);
      return { success: false, message: messages.name ?? GENERIC_ADD_ERROR };
    }

    setRows((current) =>
      sortByName([
        ...current,
        {
          id: result.material.id,
          name: result.material.name,
          inStockCount: 0,
          inStockWeight: "0",
        },
      ]),
    );
    return { success: true };
  }

  async function handleRename(
    material: MaterialRow,
    name: string,
  ): Promise<MaterialFormResult> {
    const result = await renameMaterialAction({ id: material.id, name });
    if (!result.success) {
      const messages = mapMaterialFieldErrors(result.error.fieldErrors);
      return { success: false, message: messages.name ?? GENERIC_RENAME_ERROR };
    }

    setRows((current) =>
      sortByName(
        current.map((row) =>
          row.id === material.id ? { ...row, name: result.material.name } : row,
        ),
      ),
    );
    setEditing(null);
    return { success: true };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>Adicionar material</Button>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {rows.length === 0 && (
          <li className="p-4 text-sm text-muted-foreground">
            Nenhum material cadastrado.
          </li>
        )}
        {rows.map((material) => (
          <li
            key={material.id}
            className="flex items-center justify-between gap-3 p-3.5"
          >
            <span className="font-medium text-foreground">{material.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {material.inStockCount} und. ·{" "}
                {formatWeight(material.inStockWeight)} em estoque
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(material)}
              >
                Editar
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {addOpen && (
        <MaterialFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          title="Adicionar material"
          submitLabel="Adicionar"
          onSubmit={handleAdd}
        />
      )}

      {editing && (
        <MaterialFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          title="Editar material"
          submitLabel="Salvar"
          initialName={editing.name}
          onSubmit={(name) => handleRename(editing, name)}
        />
      )}
    </div>
  );
}
