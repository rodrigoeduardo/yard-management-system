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
      className={cn(
        "flex flex-col gap-[3px] rounded-[14px] p-3 md:gap-1 md:rounded-card md:p-5",
        className,
      )}
      {...props}
    >
      <span className="font-mono text-lg font-bold text-foreground md:text-[28px]">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground md:text-[13px]">
        {label}
      </span>
    </Card>
  );
}

export { StatCard };
