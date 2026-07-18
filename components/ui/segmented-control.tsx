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
        "inline-flex w-fit items-center gap-1 rounded-pill bg-muted p-1",
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
              "rounded-pill px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
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
