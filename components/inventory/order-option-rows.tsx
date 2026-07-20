"use client";

import { cn } from "@/lib/utils";

type SortDir = "asc" | "desc";

/**
 * Radio-list rendering shared by `StockOrderOptions` and
 * `RemovalOrderOptions` (design `2a`/`2c`): each field is a row with a
 * radio indicator; the selected row is highlighted and shows inline
 * Desc/Asc direction chips, unselected rows show only an empty radio ring.
 * Row clicks pick the field while keeping the current direction; chip
 * clicks change only the direction of the already-selected field.
 */
export function OrderOptionRows<Key extends string>({
  legend,
  options,
  order,
  dir,
  onSelect,
}: {
  legend: string;
  options: readonly { key: Key; label: string }[];
  order: Key;
  dir: SortDir;
  onSelect: (order: Key, dir: SortDir) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-0.5" role="radiogroup" aria-label={legend}>
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => {
        const isSelected = order === option.key;
        return (
          <div
            key={option.key}
            role="radio"
            aria-checked={isSelected}
            aria-label={option.label}
            tabIndex={0}
            onClick={() => onSelect(option.key, dir)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(option.key, dir);
              }
            }}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-1 py-2.5",
              isSelected && "bg-primary/10",
            )}
          >
            <span
              className={cn(
                "flex items-center gap-2.5 text-sm font-semibold",
                !isSelected && "text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "relative flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  isSelected ? "border-primary bg-primary" : "border-border",
                )}
              >
                {isSelected && (
                  <span className="size-1.5 rounded-full bg-primary-foreground" />
                )}
              </span>
              {option.label}
            </span>
            {isSelected && (
              <span className="flex gap-1">
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-bold",
                    dir === "desc"
                      ? "bg-primary text-primary-foreground"
                      : "font-semibold text-muted-foreground",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(option.key, "desc");
                  }}
                >
                  Desc ↓
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-bold",
                    dir === "asc"
                      ? "bg-primary text-primary-foreground"
                      : "font-semibold text-muted-foreground",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(option.key, "asc");
                  }}
                >
                  Asc ↑
                </button>
              </span>
            )}
          </div>
        );
      })}
    </fieldset>
  );
}
