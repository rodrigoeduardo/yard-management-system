import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Icon-only trigger button shared by the order/filter controls (stock and
 * removals). The button itself is a fixed size regardless of the active
 * count — the count is an absolutely-positioned badge overlay rather than
 * inline text, so the trigger's width never changes and the search-bar row
 * it sits in doesn't reflow when a filter/order becomes active. Below `md`
 * the size is bumped to h-11 to match the adjacent search input
 * (`StockSearchInput` / `RemovalSearchInput`) so the mobile row's controls
 * align; at `md` and up it reverts to the original size-8 so the desktop
 * layout is unchanged.
 */
export function ControlTriggerButton({
  icon: Icon,
  label,
  count,
  ...props
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
} & Omit<ComponentProps<typeof Button>, "children" | "aria-label" | "size" | "variant">) {
  return (
    <div className="relative inline-flex shrink-0">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={label}
        {...props}
        className={cn("h-11 w-11 md:size-8", props.className)}
      >
        <Icon />
      </Button>
      {count ? (
        <Badge
          aria-hidden="true"
          className="pointer-events-none absolute -top-1.5 -right-1.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
        >
          {count}
        </Badge>
      ) : null}
    </div>
  );
}
