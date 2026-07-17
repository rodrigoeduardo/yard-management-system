import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

interface InputProps extends ComponentProps<"input"> {
  /** Use the mono (Spline Sans Mono) treatment for numeric fields. */
  mono?: boolean;
  /** Unit label rendered inside the field, e.g. "kg". */
  unit?: string;
}

function Input({ className, mono, unit, ...props }: InputProps) {
  const input = (
    <input
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-input border border-input bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        mono && "font-mono",
        unit && "pr-10",
        className,
      )}
      {...props}
    />
  );

  if (!unit) {
    return input;
  }

  return (
    <div className="relative">
      {input}
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}

export { Input };
