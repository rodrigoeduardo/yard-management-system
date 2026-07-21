import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  value: string | number;
  label: string;
  className?: string;
  /**
   * When given, the whole card becomes an accessible link to this path and
   * shows a chevron affordance next to the label ("Ver mais"). Omit for
   * non-clickable cards (e.g. Peso Restante).
   */
  href?: string;
}

const STAT_CARD_LAYOUT_CLASSES =
  "flex flex-col gap-[3px] rounded-[14px] p-3 md:gap-1 md:rounded-card md:p-5";

function StatCard({ value, label, href, className }: StatCardProps) {
  const content = (
    <>
      <span className="font-mono text-lg font-bold text-foreground md:text-[28px]">
        {value}
      </span>
      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground md:text-[13px]">
        {label}
        {href && (
          <ChevronRight
            className="size-3 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "rounded-card border border-border bg-card text-card-foreground transition-colors hover:bg-accent/40",
          STAT_CARD_LAYOUT_CLASSES,
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <Card className={cn(STAT_CARD_LAYOUT_CLASSES, className)}>{content}</Card>
  );
}

export { StatCard };
