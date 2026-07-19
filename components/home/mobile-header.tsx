import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";

/**
 * Mobile-only top header for the dashboard: logo + app name/subtitle on
 * the left, account initials + "Sair" logout on the right. Hidden at
 * `md:` and up, where the top-nav (`components/nav/top-nav.tsx`) already
 * shows the logo and the same account/logout affordance instead.
 */
export function MobileHomeHeader({ initials }: { initials: string }) {
  return (
    <div className="flex items-center justify-between md:hidden">
      <div className="flex items-center gap-[11px]">
        <span
          aria-hidden="true"
          className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary"
        >
          <span className="size-[13px] rotate-45 rounded-[2.5px] bg-primary-foreground" />
        </span>
        <span className="flex flex-col">
          <span className="text-[17px] leading-[1.1] font-bold text-foreground">
            Pátio
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            Controle de Estoque
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
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
    </div>
  );
}
