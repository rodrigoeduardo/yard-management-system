import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

interface SegmentedControlItem<Value extends string> {
  value: Value;
  label: string;
}

interface SegmentedControlProps<Value extends string>
  extends Omit<ComponentProps<"div">, "onChange"> {
  items: readonly SegmentedControlItem<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

function SegmentedControl<Value extends string>({
  items,
  value,
  onChange,
  className,
  ...props
}: SegmentedControlProps<Value>) {
  return (
    <div
      data-slot="segmented-control"
      role="group"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-xl bg-muted p-1",
        className,
      )}
      {...props}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "flex h-9 flex-1 items-center justify-center rounded-[9px] px-4 text-[13.5px] font-semibold whitespace-nowrap transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export { SegmentedControl };
