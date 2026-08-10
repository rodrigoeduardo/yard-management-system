import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { LinkLoaderReporter } from "@/components/ui/top-loader";
import { HOME_ENTRY_POINTS, filterHomeEntryPointsForRole } from "@/lib/home/entry-points";

/**
 * The three home-dashboard action cards (icon + title + description),
 * linking to the existing load-intake, load-removal, and inventory
 * routes. Mobile base stacks them as horizontal rows with a trailing
 * chevron; `md:` lays them out in a three-column grid of vertical cards
 * (no chevron), matching the design's mobile and desktop Início frames.
 *
 * `isViewer` (issue #314) is a boolean computed server-side from the
 * session's role and passed down — drops the write-only Entrada/Saída
 * cards, keeping Ver Estoque.
 */
export function ActionCards({ isViewer = false }: { isViewer?: boolean }) {
  const entryPoints = filterHomeEntryPointsForRole(
    HOME_ENTRY_POINTS,
    isViewer ? "viewer" : "operator",
  );

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <SectionLabel>Ações</SectionLabel>
      <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-4">
        {entryPoints.map((entryPoint) => {
          const Icon = entryPoint.icon;
          return (
            <Link key={entryPoint.href} href={entryPoint.href}>
              <LinkLoaderReporter />
              <Card className="flex items-center gap-3.5 p-4 transition-colors hover:bg-accent/40 md:flex-col md:items-start md:gap-3 md:p-[22px]">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-accent text-accent-foreground">
                  <Icon className="size-[22px]" strokeWidth={1.8} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-none">
                  <span className="text-[15px] font-semibold text-foreground md:text-[15.5px]">
                    {entryPoint.label}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground md:text-[13px]">
                    {entryPoint.description}
                  </span>
                </span>
                <ChevronRight
                  className="size-[18px] shrink-0 text-placeholder md:hidden"
                  strokeWidth={2}
                />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
