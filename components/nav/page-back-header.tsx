"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageBackHeaderProps = {
  title: string;
  action?: ReactNode;
  className?: string;
} & ({ href: string; onBack?: never } | { onBack: () => void; href?: never });

const backButtonClassName =
  "flex size-[38px] shrink-0 items-center justify-center rounded-input border border-input bg-card text-foreground";

/**
 * Shared mobile back-header: a ChevronLeft back control + the page title.
 * Always hidden at `md:` and up — desktop pages show a plain title instead,
 * with no back control (see docs/ui/design.html desktop frames).
 *
 * Pass either `href` (static back target, rendered as a Link) or `onBack`
 * (a callback, for pages with custom back logic such as a multi-step form).
 */
export function PageBackHeader({
  title,
  action,
  className,
  href,
  onBack,
}: PageBackHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2.5 md:hidden", className)}>
      {href !== undefined ? (
        <Link href={href} aria-label="Voltar" className={backButtonClassName}>
          <ChevronLeft className="size-[19px]" />
        </Link>
      ) : (
        <button
          type="button"
          aria-label="Voltar"
          onClick={onBack}
          className={backButtonClassName}
        >
          <ChevronLeft className="size-[19px]" />
        </button>
      )}
      <span className="flex-1 text-lg font-bold text-foreground">{title}</span>
      {action}
    </div>
  );
}
