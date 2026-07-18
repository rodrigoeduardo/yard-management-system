/**
 * Dashboard greeting ("Bom dia, Rafael"). Falls back to just the
 * time-of-day greeting when no session-derived display name is
 * available.
 */
export function GreetingHeader({
  greeting,
  displayName,
}: {
  greeting: string;
  displayName: string | null;
}) {
  return (
    <h1 className="text-2xl font-semibold text-foreground">
      {displayName ? `${greeting}, ${displayName}` : greeting}
    </h1>
  );
}
