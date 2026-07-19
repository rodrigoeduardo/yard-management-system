import { cn } from "@/lib/utils";

/**
 * Shared brand mark: the small rotated-diamond logo swatch + "Pátio" title.
 * Used in the desktop top-nav and above the login form so both surfaces
 * stay visually in sync.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        data-slot="brand-logo"
        className="flex size-7 items-center justify-center rounded-[8px] bg-primary"
      >
        <span className="size-2.5 rotate-45 rounded-[2px] bg-primary-foreground" />
      </span>
      <span className="text-[15.5px] font-bold">Pátio</span>
    </div>
  );
}
