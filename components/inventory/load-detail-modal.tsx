"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchLoadForEdit, fetchLoadItems } from "@/lib/actions/load-items";
import { updateItemWeightAction } from "@/lib/actions/item-weight";
import { updateLoadAction } from "@/lib/actions/loads";
import type { LoadItemDetail } from "@/lib/db/load-items";
import { formatWeight } from "@/lib/format/weight";
import { formatItemStatus } from "@/lib/inventory/item-status";
import {
  entryDateTimeInputValue,
} from "@/lib/loads/entry-datetime";
import {
  mapUpdateLoadFieldErrors,
  type UpdateLoadFieldMessages,
} from "@/lib/forms/update-load-error-map";
import { cn } from "@/lib/utils";
import { MaterialCombobox, type MaterialOption } from "@/components/loads/material-combobox";
import { Input } from "@/components/ui/input";
import type { StockRow } from "./stock-table";

const REMOVED_ITEMS_LOCK_NOTICE =
  "Nota Fiscal e Material não podem ser alterados: esta carga já tem itens removidos.";

type EditLoadFormState = {
  notaFiscal: string;
  transportOrder: string;
  driver: string;
  nfDate: string;
  entryDateTime: string;
  nfWeight: string;
  material: string;
  materialDisplay: string;
  removedItemCount: number;
};

export function LoadDetailModal({
  load,
  open,
  onOpenChange,
  itemWeightEditEnabled = false,
  loadEditEnabled = false,
  materials = [],
}: {
  load: StockRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Server-computed FEATURE_ITEM_WEIGHT_EDIT; never read process.env in this client component. */
  itemWeightEditEnabled?: boolean;
  /** Server-computed FEATURE_LOAD_EDIT; never read process.env in this client component (#352). */
  loadEditEnabled?: boolean;
  /** For the "Editar carga" Material combobox. */
  materials?: MaterialOption[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<LoadItemDetail[]>([]);
  const [isPending, startTransition] = useTransition();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedWeight, setEditedWeight] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [editingLoad, setEditingLoad] = useState(false);
  const [isEditLoadPending, startEditLoadTransition] = useTransition();
  const [editLoadForm, setEditLoadForm] = useState<EditLoadFormState | null>(
    null,
  );
  const [editLoadFieldErrors, setEditLoadFieldErrors] =
    useState<UpdateLoadFieldMessages>({});
  const [editLoadFormError, setEditLoadFormError] = useState<string | null>(
    null,
  );
  const [labelStaleNotice, setLabelStaleNotice] = useState(false);

  useEffect(() => {
    if (!open || !load) {
      return;
    }

    const loadId = load.id;
    startTransition(async () => {
      const result = await fetchLoadItems(loadId);
      setItems(result.success ? result.items : []);
    });
  }, [open, load]);

  // Resetting edit-mode state on close belongs in the close event itself,
  // not an effect keyed on `open` — an effect here would set state
  // synchronously during render's commit phase, triggering an extra
  // cascading render for no benefit (react-hooks/set-state-in-effect).
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setEditingLoad(false);
      setEditLoadForm(null);
      setEditLoadFieldErrors({});
      setEditLoadFormError(null);
      setLabelStaleNotice(false);
    }
    onOpenChange(nextOpen);
  };

  const startEditingLoad = () => {
    if (!load) return;
    setEditingLoad(true);
    setEditLoadFieldErrors({});
    setEditLoadFormError(null);
    setLabelStaleNotice(false);

    startEditLoadTransition(async () => {
      const result = await fetchLoadForEdit(load.id);
      if (!result.success) {
        setEditLoadFormError("Não foi possível carregar a carga.");
        return;
      }

      setEditLoadForm({
        notaFiscal: result.load.notaFiscal,
        transportOrder: result.load.transportOrder ?? "",
        driver: result.load.driver ?? "",
        nfDate: result.load.nfDate ?? "",
        entryDateTime: entryDateTimeInputValue(result.load.entryDate),
        nfWeight: result.load.nfWeight,
        material: result.load.materialId,
        materialDisplay: result.load.material,
        removedItemCount: result.load.removedItemCount,
      });
    });
  };

  const cancelEditingLoad = () => {
    setEditingLoad(false);
    setEditLoadForm(null);
    setEditLoadFieldErrors({});
    setEditLoadFormError(null);
  };

  const updateEditLoadField = <Field extends keyof EditLoadFormState>(
    field: Field,
    value: EditLoadFormState[Field],
  ) => {
    setEditLoadForm((current) =>
      current ? { ...current, [field]: value } : current,
    );
  };

  const handleMaterialChange = (value: string, displayValue: string) => {
    setEditLoadForm((current) =>
      current
        ? { ...current, material: value, materialDisplay: displayValue }
        : current,
    );
  };

  const saveLoad = () => {
    if (!load || !editLoadForm) return;
    setEditLoadFieldErrors({});
    setEditLoadFormError(null);

    startEditLoadTransition(async () => {
      const nfWeight = Number(editLoadForm.nfWeight);
      const result = await updateLoadAction({
        loadId: load.id,
        notaFiscal: editLoadForm.notaFiscal,
        transportOrder: editLoadForm.transportOrder,
        driver: editLoadForm.driver,
        nfDate: editLoadForm.nfDate,
        entryDateTime: editLoadForm.entryDateTime,
        nfWeight,
        material: editLoadForm.material,
      });

      if (!result.success) {
        if (typeof result.error === "string") {
          setEditLoadFormError(result.error);
        } else {
          setEditLoadFieldErrors(
            mapUpdateLoadFieldErrors(result.error.fieldErrors),
          );
          if (result.error.formErrors.length > 0) {
            setEditLoadFormError("Verifique os campos e tente novamente.");
          }
        }
        return;
      }

      setEditingLoad(false);
      setEditLoadForm(null);
      setLabelStaleNotice(result.load.labelStale);
      router.refresh();
    });
  };

  const startEditing = (item: LoadItemDetail) => {
    setEditingItemId(item.id);
    setEditedWeight(item.weight);
    setEditError(null);
  };

  const saveWeight = (item: LoadItemDetail) => {
    const weight = Number(editedWeight);
    if (!Number.isFinite(weight) || weight <= 0) {
      setEditError("Informe um peso maior que zero.");
      return;
    }

    startTransition(async () => {
      const result = await updateItemWeightAction({ itemId: item.id, weight });
      if (!result.success) {
        setEditError(
          typeof result.error === "string"
            ? result.error
            : "Não foi possível salvar o peso.",
        );
        return;
      }

      if (!load) return;
      const itemsResult = await fetchLoadItems(load.id);
      setItems(itemsResult.success ? itemsResult.items : []);
      setEditingItemId(null);
      setEditError(null);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-[20px] px-[26px] py-6 shadow-2xl sm:max-w-[600px]">
        {load && (
          <>
            <DialogHeader>
              <DialogTitle className="text-[19px] font-bold">
                Carga {load.notaFiscal}
              </DialogTitle>
              <DialogDescription
                render={<Link href={`/loads/${load.id}/print`} />}
                className="text-[13px] font-semibold text-accent-foreground no-underline"
              >
                Imprimir QR Codes
              </DialogDescription>
            </DialogHeader>

            {loadEditEnabled && !editingLoad ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={startEditingLoad}
              >
                Editar carga
              </Button>
            ) : null}

            {labelStaleNotice ? (
              <p
                role="status"
                className="rounded-[10px] bg-accent px-3 py-2 text-xs font-medium text-accent-foreground"
              >
                As etiquetas impressas desta carga ficaram desatualizadas —
                reimprima os QR Codes.
              </p>
            ) : null}

            {editingLoad && editLoadForm ? (
              <div className="flex flex-col gap-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-notaFiscal"
                      className="text-xs text-muted-foreground"
                    >
                      Nota Fiscal
                    </label>
                    <Input
                      id="edit-notaFiscal"
                      mono
                      value={editLoadForm.notaFiscal}
                      disabled={editLoadForm.removedItemCount > 0}
                      onChange={(e) =>
                        updateEditLoadField("notaFiscal", e.target.value)
                      }
                    />
                    {editLoadFieldErrors.notaFiscal && (
                      <p role="alert" className="text-xs text-destructive">
                        {editLoadFieldErrors.notaFiscal}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-material"
                      className="text-xs text-muted-foreground"
                    >
                      Material
                    </label>
                    {editLoadForm.removedItemCount > 0 ? (
                      <Input
                        id="edit-material"
                        value={editLoadForm.materialDisplay}
                        disabled
                      />
                    ) : (
                      <MaterialCombobox
                        id="edit-material"
                        materials={materials}
                        value={editLoadForm.material}
                        displayValue={editLoadForm.materialDisplay}
                        onChange={handleMaterialChange}
                      />
                    )}
                    {editLoadFieldErrors.material && (
                      <p role="alert" className="text-xs text-destructive">
                        {editLoadFieldErrors.material}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-transportOrder"
                      className="text-xs text-muted-foreground"
                    >
                      Ordem de Transporte
                    </label>
                    <Input
                      id="edit-transportOrder"
                      mono
                      value={editLoadForm.transportOrder}
                      onChange={(e) =>
                        updateEditLoadField("transportOrder", e.target.value)
                      }
                    />
                    {editLoadFieldErrors.transportOrder && (
                      <p role="alert" className="text-xs text-destructive">
                        {editLoadFieldErrors.transportOrder}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-driver"
                      className="text-xs text-muted-foreground"
                    >
                      Motorista
                    </label>
                    <Input
                      id="edit-driver"
                      value={editLoadForm.driver}
                      onChange={(e) =>
                        updateEditLoadField("driver", e.target.value)
                      }
                    />
                    {editLoadFieldErrors.driver && (
                      <p role="alert" className="text-xs text-destructive">
                        {editLoadFieldErrors.driver}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-nfDate"
                      className="text-xs text-muted-foreground"
                    >
                      Data da Nota Fiscal
                    </label>
                    <Input
                      id="edit-nfDate"
                      type="date"
                      mono
                      value={editLoadForm.nfDate}
                      onChange={(e) =>
                        updateEditLoadField("nfDate", e.target.value)
                      }
                    />
                    {editLoadFieldErrors.nfDate && (
                      <p role="alert" className="text-xs text-destructive">
                        {editLoadFieldErrors.nfDate}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-entryDateTime"
                      className="text-xs text-muted-foreground"
                    >
                      Data de Entrada
                    </label>
                    <Input
                      id="edit-entryDateTime"
                      type="datetime-local"
                      mono
                      value={editLoadForm.entryDateTime}
                      onChange={(e) =>
                        updateEditLoadField("entryDateTime", e.target.value)
                      }
                    />
                    {editLoadFieldErrors.entryDateTime && (
                      <p role="alert" className="text-xs text-destructive">
                        {editLoadFieldErrors.entryDateTime}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="edit-nfWeight"
                      className="text-xs text-muted-foreground"
                    >
                      Peso da Nota Fiscal
                    </label>
                    <Input
                      id="edit-nfWeight"
                      type="number"
                      step="any"
                      mono
                      unit="Ton"
                      value={editLoadForm.nfWeight}
                      onChange={(e) =>
                        updateEditLoadField("nfWeight", e.target.value)
                      }
                    />
                    {editLoadFieldErrors.nfWeight && (
                      <p role="alert" className="text-xs text-destructive">
                        {editLoadFieldErrors.nfWeight}
                      </p>
                    )}
                  </div>
                </div>

                {editLoadForm.removedItemCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {REMOVED_ITEMS_LOCK_NOTICE}
                  </p>
                )}
                {editLoadFormError && (
                  <p role="alert" className="text-sm text-destructive">
                    {editLoadFormError}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={saveLoad}
                    disabled={isEditLoadPending}
                  >
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cancelEditingLoad}
                    disabled={isEditLoadPending}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">NF</dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.notaFiscal}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Material</dt>
                <dd className="text-[15px] font-bold">{load.material}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Ordem de Transporte
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.transportOrder}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Motorista</dt>
                <dd className="text-[15px] font-bold">{load.driver}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Data da Nota Fiscal
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.nfDate}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Data de Entrada
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.entryDate}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">Peso da NF</dt>
                <dd className="font-mono text-[15px] font-bold">
                  {formatWeight(load.nfWeight)}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Quantidade de Itens
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {load.itemCount}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">
                  Peso Restante
                </dt>
                <dd className="font-mono text-[15px] font-bold">
                  {formatWeight(load.remainingWeight)}
                </dd>
              </div>
            </dl>
              </>
            )}

            <div className="max-h-64 overflow-y-auto rounded-[14px] border border-border">
              {isPending ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Carregando itens...
                </p>
              ) : items.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  Nenhum item encontrado para esta carga.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.id} className="px-[18px] py-3.5 text-[13.5px]">
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[1fr_110px_110px] md:items-center">
                        <span className="font-semibold">
                          Item {item.number} — {load.material}
                          {item.corrida ? (
                            <span className="block text-xs font-normal text-muted-foreground">
                              Corrida: <span>{item.corrida}</span>
                            </span>
                          ) : null}
                        </span>
                        <div className="flex items-center justify-between md:block md:text-right">
                          <span className="text-xs text-muted-foreground md:hidden">
                            Peso
                          </span>
                          <span className="font-mono">
                            {formatWeight(item.weight)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between md:block md:text-right">
                          <span className="text-xs text-muted-foreground md:hidden">
                            Status
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              item.status === "in_stock"
                                ? "text-success-foreground"
                                : "text-destructive",
                            )}
                          >
                            {formatItemStatus(item.status)}
                          </span>
                        </div>
                      </div>
                      {itemWeightEditEnabled && item.status === "in_stock" ? (
                        editingItemId === item.id ? (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <label className="sr-only" htmlFor={`item-weight-${item.id}`}>
                              Peso do item {item.number}
                            </label>
                            <input
                              id={`item-weight-${item.id}`}
                              type="number"
                              min="0"
                              step="any"
                              value={editedWeight}
                              onChange={(event) => setEditedWeight(event.target.value)}
                              className="h-8 w-28 rounded-md border border-input bg-background px-2 font-mono text-sm"
                            />
                            <Button type="button" size="sm" onClick={() => saveWeight(item)} disabled={isPending}>
                              Salvar peso
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingItemId(null);
                                setEditError(null);
                              }}
                              disabled={isPending}
                            >
                              Cancelar
                            </Button>
                            {editError ? <p className="w-full text-sm text-destructive">{editError}</p> : null}
                          </div>
                        ) : (
                          <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => startEditing(item)}>
                            Editar peso
                          </Button>
                        )
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
