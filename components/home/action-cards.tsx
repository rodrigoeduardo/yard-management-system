import Link from "next/link";

import { Card } from "@/components/ui/card";
import { HOME_ENTRY_POINTS } from "@/lib/home/entry-points";

/**
 * The three home-dashboard action cards (icon + title + description),
 * linking to the existing load-intake, load-removal, and inventory
 * routes. Mobile base is a single column; `md:` lays them out in three
 * columns.
 */
export function ActionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {HOME_ENTRY_POINTS.map((entryPoint) => {
        const Icon = entryPoint.icon;
        return (
          <Link key={entryPoint.href} href={entryPoint.href}>
            <Card className="flex flex-col gap-3 p-5 transition-colors hover:bg-accent">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <span className="font-medium text-foreground">
                {entryPoint.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {entryPoint.description}
              </span>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
