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

  const filledWeightCount = itemWeights.filter(
    (weight) => weight.trim() !== "",
  ).length;
  const allWeightsEntered =
    itemCount > 0 && filledWeightCount === itemCount;
  const remainingWeight = itemWeights.reduce((sum, weight) => {
    const parsed = Number(weight);
    return sum + (Number.isFinite(parsed) ? parsed : 0);
  }, 0);
  const weightFillPercent =
    itemCount > 0 ? Math.round((filledWeightCount / itemCount) * 100) : 0;

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

            <div
              data-testid="pesos-nf-chip"
              className="flex w-fit items-center gap-2 rounded-pill border border-border bg-secondary px-3 py-1.5 text-sm text-secondary-foreground md:hidden"
            >
              <span className="font-mono font-medium">{notaFiscal}</span>
              <span className="text-muted-foreground">•</span>
              <span>{material}</span>
            </div>

            <div
              data-testid="pesos-weights-grid"
              className="grid grid-cols-2 gap-3 md:grid-cols-4"
            >
              {itemWeights.map((weight, index) => (
                <div
                  key={index}
                  data-testid={`pesos-item-${index}`}
                  className="flex flex-col gap-1.5"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    Item {index + 1}
                  </span>
                  <Input
                    type="number"
                    step="any"
                    mono
                    unit="kg"
                    aria-label={`Peso do item ${index + 1}`}
                    value={weight}
                    onChange={(e) =>
                      handleItemWeightChange(index, e.target.value)
                    }
                    required
                  />
                  {itemWeightErrors[index] && (
                    <p role="alert" className="text-sm text-destructive">
                      {itemWeightErrors[index]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Card className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Peso Restante
                  </span>
                  <span
                    data-testid="pesos-remaining-weight"
                    className="font-mono text-lg font-semibold text-foreground"
                  >
                    {remainingWeight} kg
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Peso da NF
                  </span>
                  <span
                    data-testid="pesos-nf-weight"
                    className="font-mono text-lg font-semibold text-muted-foreground"
                  >
                    {nfWeight || 0} kg
                  </span>
                </div>
              </div>
              <div
                role="progressbar"
                aria-label="Progresso do preenchimento dos pesos"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={weightFillPercent}
                className="h-2 w-full overflow-hidden rounded-pill bg-muted"
              >
                <div
                  className="h-full rounded-pill bg-primary transition-all"
                  style={{ width: `${weightFillPercent}%` }}
                />
              </div>
            </Card>

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending || !allWeightsEntered}
              className="hidden self-start md:inline-flex"
            >
              Criar carga e gerar {itemCount} QR Codes
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
            <Button
              type="submit"
              disabled={isPending || !allWeightsEntered}
              className="w-full"
            >
              Criar carga e gerar {itemCount} QR Codes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
