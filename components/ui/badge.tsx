import { cva, type VariantProps } from "class-variance-authority";
import { Check } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success: "bg-success text-success-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    >
      {variant === "success" && <Check className="size-3" />}
      {props.children}
    </span>
  );
}

export { Badge, badgeVariants };
