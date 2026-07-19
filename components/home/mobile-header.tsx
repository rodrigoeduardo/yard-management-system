/**
 * Mobile-only top header for the dashboard: logo + app name/subtitle.
 * Hidden at `md:` and up, where the top-nav (`components/nav/top-nav.tsx`)
 * already shows the logo and the desktop greeting block takes its place
 * instead.
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
    </div>
  );
}
