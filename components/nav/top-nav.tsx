"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { LinkLoaderReporter } from "@/components/ui/top-loader";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/nav/nav-items";
import { cn } from "@/lib/utils";

/**
 * Desktop top-nav: logo, horizontal links, avatar initials, and the Sair
 * button. Hidden below `md:`, where the bottom tab bar takes over.
 */
export function TopNav({ initials }: { initials: string }) {
  const pathname = usePathname();

  return (
    <header className="hidden items-center justify-between gap-4 border-b border-border bg-card px-6 py-3 md:flex">
      <div className="flex items-center gap-6">
        <span className="text-sm font-semibold">Controle de Estoque de Pátio</span>
        <nav className="flex items-center gap-1">
          {APP_NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground",
                  active && "bg-accent text-accent-foreground hover:text-accent-foreground",
                )}
              >
                {item.desktopLabel}
                <LinkLoaderReporter />
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-pill bg-accent text-xs font-semibold text-accent-foreground"
        >
          {initials}
        </span>
        <form action={logout}>
          <Button type="submit" variant="outline" size="sm">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
