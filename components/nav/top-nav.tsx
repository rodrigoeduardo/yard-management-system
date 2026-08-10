"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { logout } from "@/app/login/actions";
import { BrandLogo } from "@/components/nav/brand-logo";
import { Button } from "@/components/ui/button";
import { LinkLoaderReporter } from "@/components/ui/top-loader";
import { APP_NAV_ITEMS, filterNavItemsForRole, isNavItemActive } from "@/lib/nav/nav-items";
import { cn } from "@/lib/utils";

/**
 * Desktop top-nav: logo, horizontal links, avatar initials, and the Sair
 * button. Hidden below `md:`, where the bottom tab bar takes over.
 *
 * `isViewer` (issue #314) is a boolean computed server-side from the
 * session's role and passed down — this component never reads the session
 * or `process.env` itself. It drops the write-only Entrada/Saída links.
 */
export function TopNav({
  initials,
  isViewer = false,
}: {
  initials: string;
  isViewer?: boolean;
}) {
  const pathname = usePathname();
  const items = filterNavItemsForRole(
    APP_NAV_ITEMS,
    isViewer ? "viewer" : "operator",
  );

  return (
    <header className="hidden h-[60px] items-center gap-[26px] border-b border-border bg-card px-8 md:flex print:hidden">
      <BrandLogo />
      <nav className="flex items-center gap-1.5">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-[8px] px-3 py-[7px] text-[13.5px] font-semibold text-muted-foreground hover:text-foreground",
                active && "bg-accent text-accent-foreground hover:text-accent-foreground",
              )}
            >
              {item.desktopLabel}
              <LinkLoaderReporter />
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground"
        >
          {initials}
        </span>
        <form action={logout}>
          <Button
            type="submit"
            variant="outline"
            className="h-[34px] rounded-[10px] border-border bg-card px-3.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
          >
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
