"use client";

import { Calendar, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { useTopLoaderTask } from "@/components/ui/top-loader";
import { createLoad } from "@/lib/actions/loads";
import {
  type CreateLoadFieldMessages,
  type CreateLoadItemWeightMessages,
  mapCreateLoadFieldErrors,
  mapCreateLoadItemWeightErrors,
} from "@/lib/forms/create-load-error-map";
import {
  getCurrentEntryDateValue,
  getCurrentEntryTimeValue,
} from "@/lib/loads/entry-datetime";
import { cn } from "@/lib/utils";

type Step = "dados" | "pesos";

export default function NewLoadPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  useTopLoaderTask(isPending);
  const [step, setStep] = useState<Step>("dados");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [entryDate, setEntryDate] = useState(() => getCurrentEntryDateValue());
  const [entryTime, setEntryTime] = useState(() => getCurrentEntryTimeValue());
  const [nfWeight, setNfWeight] = useState("");
  const [material, setMaterial] = useState("");
  const [itemCount, setItemCount] = useState(1);
  const [itemWeights, setItemWeights] = useState<string[]>([""]);
  const [fieldErrors, setFieldErrors] = useState<CreateLoadFieldMessages>({});
  const [itemWeightErrors, setItemWeightErrors] =
    useState<CreateLoadItemWeightMessages>({});
  const [formError, setFormError] = useState<string | undefined>();

  function handleBack() {
    if (step === "pesos") {
      setStep("dados");
      return;
    }
    router.push("/");
  }

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

  const dadosValid =
    notaFiscal.trim() !== "" &&
    entryDate.trim() !== "" &&
    entryTime.trim() !== "" &&
    nfWeight.trim() !== "" &&
    Number.isFinite(Number(nfWeight)) &&
    Number(nfWeight) > 0 &&
    material.trim() !== "";

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
        entryTime,
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

  const mobileTitle = step === "dados" ? "Nova Carga" : "Pesos dos Itens";
  const stepNumber = step === "dados" ? 1 : 2;

  return (
    <div className="flex flex-col gap-5 px-4 py-6 pb-28 md:mx-auto md:w-full md:max-w-4xl md:gap-[22px] md:px-8 md:pb-10">
      <div className="flex items-center gap-2.5 md:hidden">
        <button
          type="button"
          aria-label="Voltar"
          onClick={handleBack}
          className="flex size-[38px] shrink-0 items-center justify-center rounded-input border border-input bg-card text-foreground"
        >
          <ChevronLeft className="size-[19px]" />
        </button>
        <span className="flex-1 text-lg font-bold text-foreground">
          {mobileTitle}
        </span>
        <span className="rounded-pill bg-accent px-3 py-[5px] font-mono text-xs font-semibold text-accent-foreground">
          Etapa {stepNumber} de 2
        </span>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <h1 className="flex-1 text-[22px] font-bold text-foreground">
          Nova Carga
        </h1>
        <span className="text-[12.5px] text-muted-foreground">
          Todos os campos são obrigatórios
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-[360px_1fr] md:items-start md:gap-5">
          <Card
            data-testid="load-form-dados-panel"
            className={cn(
              "flex-col gap-5 border-transparent bg-transparent p-0 md:flex md:rounded-card md:border-border md:bg-card md:p-[22px]",
              step === "dados" ? "flex" : "hidden",
            )}
          >
            <SectionLabel className="hidden md:block">
              Dados da Nota Fiscal
            </SectionLabel>

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
                placeholder="000.000"
                value={notaFiscal}
                onChange={(e) => setNotaFiscal(e.target.value)}
                required
                className="h-12 px-3.5 text-[15px] md:h-11 md:text-sm"
              />
              {fieldErrors.notaFiscal && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.notaFiscal}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="entryDate"
                  className="text-sm font-medium text-foreground"
                >
                  Data de Entrada
                </label>
                <div className="relative">
                  <Input
                    id="entryDate"
                    type="date"
                    mono
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    required
                    className="h-12 px-3.5 pr-11 text-[15px] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:size-full [&::-webkit-calendar-picker-indicator]:opacity-0 md:h-11 md:text-sm"
                  />
                  <Calendar className="pointer-events-none absolute right-3.5 top-1/2 size-[19px] -translate-y-1/2 text-muted-foreground" />
                </div>
                {fieldErrors.entryDate && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldErrors.entryDate}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="entryTime"
                  className="text-sm font-medium text-foreground"
                >
                  Hora de Entrada
                </label>
                <Input
                  id="entryTime"
                  type="time"
                  mono
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  required
                  className="h-12 px-3.5 text-[15px] md:h-11 md:text-sm"
                />
                {fieldErrors.entryTime && (
                  <p role="alert" className="text-sm text-destructive">
                    {fieldErrors.entryTime}
                  </p>
                )}
              </div>
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
                inputMode="decimal"
                mono
                unit="kg"
                placeholder="0"
                value={nfWeight}
                onChange={(e) => setNfWeight(e.target.value)}
                required
                className="h-12 px-3.5 text-[15px] md:h-11 md:text-sm"
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
                placeholder="Ex: Sucata de Alumínio"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                required
                className="h-12 px-3.5 text-[15px] md:h-11 md:text-sm"
              />
              {fieldErrors.material && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.material}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Quantidade de Itens
              </label>
              <div
                role="group"
                aria-label="Quantidade de Itens"
                className="flex items-center gap-2.5"
              >
                <button
                  type="button"
                  aria-label="Diminuir quantidade de itens"
                  disabled={itemCount <= 1}
                  onClick={() =>
                    handleItemCountChange(String(itemCount - 1))
                  }
                  className="flex size-12 shrink-0 items-center justify-center rounded-input border border-input bg-card text-foreground disabled:opacity-40 md:size-11"
                >
                  <Minus className="size-[18px]" />
                </button>
                <span className="flex h-12 flex-1 items-center justify-center rounded-input border-[1.5px] border-primary font-mono text-[17px] font-bold text-foreground md:h-11 md:text-base">
                  {itemCount}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar quantidade de itens"
                  disabled={itemCount >= 20}
                  onClick={() =>
                    handleItemCountChange(String(itemCount + 1))
                  }
                  className="flex size-12 shrink-0 items-center justify-center rounded-input border border-input bg-card text-foreground disabled:opacity-40 md:size-11"
                >
                  <Plus className="size-[18px]" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">
                Máximo de 20 itens por carga. Um campo de peso será gerado
                para cada item.
              </span>
            </div>
          </Card>

          <Card
            data-testid="load-form-pesos-panel"
            className={cn(
              "flex-col gap-4 border-transparent bg-transparent p-0 md:flex md:gap-4 md:rounded-card md:border-border md:bg-card md:p-[22px]",
              step === "pesos" ? "flex" : "hidden",
            )}
          >
            <div className="hidden items-baseline justify-between md:flex">
              <SectionLabel>Peso de Cada Item</SectionLabel>
              <span className="text-xs text-muted-foreground">
                {filledWeightCount} de {itemCount} preenchidos
              </span>
            </div>

            <div
              data-testid="pesos-nf-chip"
              className="flex w-fit items-center gap-2 rounded-card border border-border bg-card px-3.5 py-3 text-[12.5px] text-secondary-foreground md:hidden"
            >
              <span className="font-mono font-bold text-accent-foreground">
                NF {notaFiscal}
              </span>
              <span className="text-border">•</span>
              <span className="font-semibold">{material}</span>
              <span className="text-border">•</span>
              <span className="text-muted-foreground">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </span>
            </div>

            <div
              data-testid="pesos-weights-grid"
              className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3"
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
                    inputMode="decimal"
                    mono
                    unit="kg"
                    placeholder="0"
                    aria-label={`Peso do item ${index + 1}`}
                    value={weight}
                    onChange={(e) =>
                      handleItemWeightChange(index, e.target.value)
                    }
                    required
                    className="h-[46px] px-3 text-[15px] md:h-[42px] md:text-sm"
                  />
                  {itemWeightErrors[index] && (
                    <p role="alert" className="text-sm text-destructive">
                      {itemWeightErrors[index]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden flex-col gap-4 border-t border-border pt-4 md:flex">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11.5px] text-muted-foreground">
                      Peso Restante (soma dos itens)
                    </span>
                    <span className="font-mono text-xl font-bold text-foreground">
                      {remainingWeight} kg
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11.5px] text-muted-foreground">
                      Peso da Nota Fiscal
                    </span>
                    <span className="font-mono text-xl font-bold text-muted-foreground">
                      {nfWeight || 0} kg
                    </span>
                  </div>
                </div>
                <span className="text-[11.5px] text-muted-foreground">
                  A soma não precisa ser igual ao peso da NF.
                </span>
              </div>
              <Button
                type="submit"
                disabled={isPending || !allWeightsEntered}
                className="h-12 w-full rounded-[13px] px-6 text-[14.5px]"
              >
                {isPending
                  ? "Criando…"
                  : `Criar carga e gerar ${itemCount} QR Codes`}
              </Button>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
          </Card>
        </div>

        {step === "dados" && (
          <div className="fixed inset-x-0 bottom-16 z-20 bg-gradient-to-t from-background from-45% to-transparent px-5 pt-7 pb-[26px] md:hidden">
            <Button
              type="button"
              disabled={!dadosValid}
              className="h-[52px] w-full gap-2 rounded-[14px] text-[15px]"
              onClick={() => setStep("pesos")}
            >
              Continuar para pesos
              <ChevronRight className="size-[17px]" />
            </Button>
          </div>
        )}
        {step === "pesos" && (
          <div className="fixed inset-x-0 bottom-16 z-20 flex flex-col gap-3 bg-gradient-to-t from-background from-45% to-transparent px-5 pt-7 pb-[26px] md:hidden">
            <Card className="flex flex-col gap-2 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold text-foreground">
                  Peso Restante (soma dos itens)
                </span>
                <span
                  data-testid="pesos-remaining-weight"
                  className="font-mono text-[17px] font-bold text-foreground"
                >
                  {remainingWeight} kg
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">
                  Peso da Nota Fiscal
                </span>
                <span
                  data-testid="pesos-nf-weight"
                  className="font-mono text-[13px] text-muted-foreground"
                >
                  {nfWeight || 0} kg
                </span>
              </div>
              <div
                role="progressbar"
                aria-label="Progresso do preenchimento dos pesos"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={weightFillPercent}
                className="h-1.5 w-full overflow-hidden rounded-pill bg-muted"
              >
                <div
                  className="h-full rounded-pill bg-primary transition-all"
                  style={{ width: `${weightFillPercent}%` }}
                />
              </div>
              <span className="text-[11.5px] text-muted-foreground">
                {filledWeightCount} de {itemCount} itens preenchidos · não
                precisa ser igual ao peso da NF
              </span>
            </Card>
            <Button
              type="submit"
              disabled={isPending || !allWeightsEntered}
              className="h-[52px] w-full rounded-[14px] text-[15px]"
            >
              {isPending
                ? "Criando…"
                : `Criar carga e gerar ${itemCount} QR Codes`}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
