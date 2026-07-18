"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrintButton({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <Button className={cn("print:hidden", className)} onClick={() => window.print()}>
      {children ?? "Imprimir"}
    </Button>
  );
}
