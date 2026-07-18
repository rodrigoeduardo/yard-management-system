"use client";

import { Home, PackageMinus, PackagePlus, Warehouse } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { LinkLoaderReporter } from "@/components/ui/top-loader";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/nav/nav-items";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/": Home,
  "/loads/new": PackagePlus,
  "/removals/new": PackageMinus,
  "/inventory": Warehouse,
};

/**
 * Fixed bottom tab bar for mobile. Hidden at `md:` and up, where the
 * top-nav takes over.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-card px-2 py-2 md:hidden print:hidden"
    >
      {APP_NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.href];
        const active = isNavItemActive(pathname, item);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-pill px-3 py-1 text-xs font-medium text-muted-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            <Icon className="size-5" />
            {item.mobileLabel}
            <LinkLoaderReporter />
          </Link>
        );
      })}
    </nav>
  );
}
