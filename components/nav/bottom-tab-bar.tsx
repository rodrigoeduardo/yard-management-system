"use client";

import { Boxes, Home, PackageMinus, PackagePlus, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { LinkLoaderReporter } from "@/components/ui/top-loader";
import { APP_NAV_ITEMS, filterNavItemsForRole, isNavItemActive } from "@/lib/nav/nav-items";

const ICONS: Record<string, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  "/": Home,
  "/loads/new": PackagePlus,
  "/removals/new": PackageMinus,
  "/inventory": Warehouse,
  "/materials": Boxes,
};

/**
 * Fixed bottom tab bar for mobile. Hidden at `md:` and up, where the
 * top-nav takes over.
 *
 * `isViewer` (issue #314) is a boolean computed server-side from the
 * session's role and passed down — drops the write-only Entrada/Saída tabs.
 */
export function BottomTabBar({ isViewer = false }: { isViewer?: boolean }) {
  const pathname = usePathname();
  const items = filterNavItemsForRole(
    APP_NAV_ITEMS,
    isViewer ? "viewer" : "operator",
  );

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-card/[0.94] px-2.5 pt-2 pb-[22px] backdrop-blur md:hidden print:hidden",
        items.length === 5 ? "grid-cols-5" : "grid-cols-3",
      )}
    >
      {items.map((item) => {
        const Icon = ICONS[item.href];
        const active = isNavItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-[3px] text-[10.5px] font-semibold text-muted-foreground",
              active && "text-accent-foreground",
            )}
          >
            <span
              className={cn("flex rounded-pill px-[15px] py-1", active && "bg-accent")}
            >
              <Icon className="size-[21px]" strokeWidth={1.9} />
            </span>
            {item.mobileLabel}
            <LinkLoaderReporter />
          </Link>
        );
      })}
    </nav>
  );
}
