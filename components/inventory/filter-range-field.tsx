"use client";

import { Input } from "@/components/ui/input";

/**
 * A labeled "from — até — to" range row (design `2b`/`2d`): a small bold
 * muted legend above two mono-font inputs joined by a muted "até". Shared
 * by `StockFilterFields` and `RemovalFilterFields` so the date and weight
 * ranges stay pixel-identical between the stock and removal filter modals.
 */
export function FilterRangeField({
  legend,
  type,
  valueFrom,
  valueTo,
  onChangeFrom,
  onChangeTo,
  ariaLabelFrom,
  ariaLabelTo,
  placeholderFrom,
  placeholderTo,
}: {
  legend: string;
  type: "date" | "number";
  valueFrom: string;
  valueTo: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  ariaLabelFrom: string;
  ariaLabelTo: string;
  placeholderFrom?: string;
  placeholderTo?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-bold text-muted-foreground">{legend}</legend>
      <div className="flex items-center gap-2">
        <Input
          type={type}
          mono
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "any" : undefined}
          placeholder={placeholderFrom}
          aria-label={ariaLabelFrom}
          value={valueFrom}
          onChange={(event) => onChangeFrom(event.target.value)}
        />
        <span className="text-xs text-muted-foreground">até</span>
        <Input
          type={type}
          mono
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "any" : undefined}
          placeholder={placeholderTo}
          aria-label={ariaLabelTo}
          value={valueTo}
          onChange={(event) => onChangeTo(event.target.value)}
        />
      </div>
    </fieldset>
  );
}
