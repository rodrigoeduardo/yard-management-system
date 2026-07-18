"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Breadcrumbs } from "@/components/nav/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { createLoad } from "@/lib/actions/loads";
import {
  type CreateLoadFieldMessages,
  type CreateLoadItemWeightMessages,
  mapCreateLoadFieldErrors,
  mapCreateLoadItemWeightErrors,
} from "@/lib/forms/create-load-error-map";
import { buildTrail } from "@/lib/nav/breadcrumbs";
import { cn } from "@/lib/utils";

// The per-item weight grid itself is restyled in a follow-up issue (#74).
// These fields keep the original, minimal styling here.
const itemWeightInputClassName =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type Step = "dados" | "pesos";

export default function NewLoadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("dados");
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
    <div className="flex flex-col gap-6 px-4 py-6 pb-28 md:mx-auto md:w-full md:max-w-4xl md:px-8 md:pb-10">
      <Breadcrumbs
        items={buildTrail({ href: "/loads/new", label: "Nova Carga" })}
      />
      <h1 className="text-2xl font-semibold text-foreground">Nova Carga</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2 md:items-start">
          <Card
            data-testid="load-form-dados-panel"
            className={cn(
              "flex-col gap-5 p-5 md:flex",
              step === "dados" ? "flex" : "hidden",
            )}
          >
            <SectionLabel>Dados da Nota Fiscal</SectionLabel>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="notaFiscal"
                className="text-sm font-medium text-foreground"
              >
                Nota Fiscal
              </label>
              <Input
                id="notaFiscal"
                mono
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                required
              />
              {fieldErrors.notaFiscal && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.notaFiscal}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="entryDate"
                className="text-sm font-medium text-foreground"
              >
                Data de Entrada
              </label>
              <Input
                id="entryDate"
                type="date"
                mono
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                required
              />
              {fieldErrors.entryDate && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.entryDate}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="nfWeight"
                className="text-sm font-medium text-foreground"
              >
                Peso da Nota Fiscal
              </label>
              <Input
                id="nfWeight"
                type="number"
                step="any"
                mono
                unit="kg"
                value={nfWeight}
                onChange={(e) => setNfWeight(e.target.value)}
                required
              />
              {fieldErrors.nfWeight && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.nfWeight}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="material"
                className="text-sm font-medium text-foreground"
              >
                Material
              </label>
              <Input
                id="material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                required
              />
              {fieldErrors.material && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.material}
                </p>
              )}
            </div>

            <div
              role="group"
              aria-label="Quantidade de Itens"
              className="flex items-center justify-between rounded-input border border-input bg-card px-3 py-2"
            >
              <span className="text-sm font-medium text-foreground">
                Quantidade de Itens
              </span>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  aria-label="Diminuir quantidade de itens"
                  disabled={itemCount <= 1}
                  onClick={() =>
                    handleItemCountChange(String(itemCount - 1))
                  }
                  className="flex size-8 items-center justify-center rounded-full border border-input text-foreground disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-6 text-center font-mono text-base font-semibold text-foreground">
                  {itemCount}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade de itens"
                  disabled={itemCount >= 20}
                  onClick={() =>
                    handleItemCountChange(String(itemCount + 1))
                  }
                  className="flex size-8 items-center justify-center rounded-full border border-input text-foreground disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          </Card>

          <Card
            data-testid="load-form-pesos-panel"
            className={cn(
              "flex-col gap-4 p-5 md:flex",
              step === "pesos" ? "flex" : "hidden",
            )}
          >
            <SectionLabel>Peso de Cada Item</SectionLabel>
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
                  className={itemWeightInputClassName}
                />
                {itemWeightErrors[index] && (
                  <p role="alert" className="text-sm text-destructive">
                    {itemWeightErrors[index]}
                  </p>
                )}
              </div>
            ))}

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="hidden self-start md:inline-flex"
            >
              Criar Carga
            </Button>
            <Button
              type="button"
              variant="outline"
              className="self-start md:hidden"
              onClick={() => setStep("dados")}
            >
              Voltar
            </Button>
          </Card>
        </div>

        {step === "dados" && (
          <div className="fixed inset-x-0 bottom-16 border-t border-border bg-card p-4 md:hidden">
            <Button
              type="button"
              className="w-full"
              onClick={() => setStep("pesos")}
            >
              Continuar para pesos
            </Button>
          </div>
        )}
        {step === "pesos" && (
          <div className="fixed inset-x-0 bottom-16 border-t border-border bg-card p-4 md:hidden">
            <Button type="submit" disabled={isPending} className="w-full">
              Criar Carga
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
