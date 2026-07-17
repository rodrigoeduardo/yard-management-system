"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Button } from "@/components/ui/button";
import { createLoad } from "@/lib/actions/loads";
import {
  type CreateLoadFieldMessages,
  type CreateLoadItemWeightMessages,
  mapCreateLoadFieldErrors,
  mapCreateLoadItemWeightErrors,
} from "@/lib/forms/create-load-error-map";
import { buildTrail } from "@/lib/nav/breadcrumbs";

const inputClassName =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function NewLoadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notaFiscal, setNotaFiscal] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [nfWeight, setNfWeight] = useState("");
  const [material, setMaterial] = useState("");
  const [itemCount, setItemCount] = useState(1);
  const [itemWeights, setItemWeights] = useState<string[]>([""]);
  const [fieldErrors, setFieldErrors] = useState<CreateLoadFieldMessages>({});
  const [itemWeightErrors, setItemWeightErrors] =
    useState<CreateLoadItemWeightMessages>({});
  const [formError, setFormError] = useState<string | undefined>();

  function handleItemCountChange(value: string) {
    const count = Math.max(1, Math.min(20, Number(value) || 1));
    setItemCount(count);
    setItemWeights((current) => {
      const next = current.slice(0, count);
      while (next.length < count) next.push("");
      return next;
    });
  }

  function handleItemWeightChange(index: number, value: string) {
    setItemWeights((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFieldErrors({});
    setItemWeightErrors({});
    setFormError(undefined);

    startTransition(async () => {
      const result = await createLoad({
        notaFiscal,
        entryDate,
        nfWeight: Number(nfWeight),
        material,
        itemWeights: itemWeights.map((weight) => Number(weight)),
      });

      if (!result.success) {
        setFieldErrors(mapCreateLoadFieldErrors(result.error.fieldErrors));
        setItemWeightErrors(
          mapCreateLoadItemWeightErrors(result.error.itemWeightErrors),
        );
        if (result.error.formErrors.length > 0) {
          setFormError("Verifique os campos e tente novamente.");
        }
        return;
      }

      router.push(`/loads/${result.load.id}/print`);
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-8">
      <div className="w-full max-w-sm">
        <Breadcrumbs
          items={buildTrail({ href: "/loads/new", label: "Nova Carga" })}
        />
      </div>
      <h1 className="text-2xl font-semibold">Nova Carga</h1>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="notaFiscal" className="text-sm font-medium">
            Nota Fiscal
          </label>
          <input
            id="notaFiscal"
            value={notaFiscal}
            onChange={(e) => setNotaFiscal(e.target.value)}
            required
            className={inputClassName}
          />
          {fieldErrors.notaFiscal && (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.notaFiscal}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="entryDate" className="text-sm font-medium">
            Data de Entrada
          </label>
          <input
            id="entryDate"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            required
            className={inputClassName}
          />
          {fieldErrors.entryDate && (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.entryDate}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nfWeight" className="text-sm font-medium">
            Peso da Nota Fiscal
          </label>
          <input
            id="nfWeight"
            type="number"
            step="any"
            value={nfWeight}
            onChange={(e) => setNfWeight(e.target.value)}
            required
            className={inputClassName}
          />
          {fieldErrors.nfWeight && (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.nfWeight}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="material" className="text-sm font-medium">
            Material
          </label>
          <input
            id="material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            required
            className={inputClassName}
          />
          {fieldErrors.material && (
            <p role="alert" className="text-sm text-destructive">
              {fieldErrors.material}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="itemCount" className="text-sm font-medium">
            Quantidade de Itens
          </label>
          <input
            id="itemCount"
            type="number"
            min={1}
            max={20}
            value={itemCount}
            onChange={(e) => handleItemCountChange(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Peso de Cada Item</span>
          {itemWeights.map((weight, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <input
                type="number"
                step="any"
                aria-label={`Peso do item ${index + 1}`}
                value={weight}
                onChange={(e) =>
                  handleItemWeightChange(index, e.target.value)
                }
                required
                className={inputClassName}
              />
              {itemWeightErrors[index] && (
                <p role="alert" className="text-sm text-destructive">
                  {itemWeightErrors[index]}
                </p>
              )}
            </div>
          ))}
        </div>

        {formError && (
          <p role="alert" className="text-sm text-destructive">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          Criar Carga
        </Button>
      </form>
    </main>
  );
}
