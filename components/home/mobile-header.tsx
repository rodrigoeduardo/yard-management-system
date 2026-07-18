import { Moon } from "lucide-react";

/**
 * Mobile-only top header for the dashboard: logo + app name/subtitle on
 * the left, a settings-style icon button on the right. Hidden at `md:`
 * and up, where the top-nav (`components/nav/top-nav.tsx`) already shows
 * the logo and the desktop greeting block takes its place instead.
 *
 * The icon button is a visual placeholder matching the design frame —
 * it has no behavior yet (no settings/theme feature exists).
 */
export function MobileHomeHeader() {
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
      <button
        type="button"
        aria-label="Configurações"
        className="flex size-[38px] items-center justify-center rounded-[12px] border border-border bg-card text-muted-foreground"
      >
        <Moon className="size-[19px]" strokeWidth={1.8} />
      </button>
    </div>
  );
}
