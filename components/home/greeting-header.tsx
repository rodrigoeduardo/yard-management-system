/**
 * Desktop-only greeting block ("Bom dia, Rafael" + a date subtitle).
 * Falls back to just the time-of-day greeting when no session-derived
 * display name is available. Hidden below `md:` — mobile shows
 * `MobileHomeHeader` instead (the design's Início frame has no greeting
 * text on mobile, only the logo header).
 */
export function GreetingHeader({
  greeting,
  displayName,
  dateLabel,
}: {
  greeting: string;
  displayName: string | null;
  dateLabel: string;
}) {
  return (
    <div className="hidden md:flex md:flex-col md:gap-1">
      <h1 className="text-2xl font-bold text-foreground">
        {displayName ? `${greeting}, ${displayName}` : greeting}
      </h1>
      <p className="text-sm text-muted-foreground">
        Resumo do pátio em {dateLabel}
      </p>
    </div>
  );
}
