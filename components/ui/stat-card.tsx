import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps extends ComponentProps<"div"> {
  value: string | number;
  label: string;
}

function StatCard({ value, label, className, ...props }: StatCardProps) {
  return (
    <Card
      className={cn("flex flex-col gap-1 p-4", className)}
      {...props}
    >
      <span className="font-mono text-2xl font-semibold text-foreground">
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Card>
  );
}

export { StatCard };
