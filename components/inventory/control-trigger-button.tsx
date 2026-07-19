import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Icon-only trigger button shared by the order/filter controls (stock and
 * removals). The button itself is a fixed size regardless of the active
 * count — the count is an absolutely-positioned badge overlay rather than
 * inline text, so the trigger's width never changes and the search-bar row
 * it sits in doesn't reflow when a filter/order becomes active.
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
    <div className="relative inline-flex">
      <Button type="button" variant="outline" size="icon" aria-label={label} {...props}>
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
