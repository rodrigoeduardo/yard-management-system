/**
 * Greeting block ("Bom dia, Rafael" + a date subtitle), shown on both
 * mobile and desktop. Falls back to just the time-of-day greeting when
 * no session-derived display name is available. Mobile shows this above
 * `MobileHomeHeader`'s account/logout row; desktop shows it inline in
 * the top-nav area.
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
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-foreground">
        {displayName ? `${greeting}, ${displayName}` : greeting}
      </h1>
      <p className="text-sm text-muted-foreground">
        Resumo do pátio em {dateLabel}
      </p>
    </div>
  );
}
