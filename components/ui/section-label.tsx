import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function SectionLabel({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      data-slot="section-label"
      className={cn(
        "text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { SectionLabel };
