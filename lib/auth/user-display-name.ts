/**
 * Derives a display name for the dashboard greeting from a user's email
 * local part (e.g. "rafael.silva@example.com" -> "Rafael"). Returns null
 * when no email is available, so callers can fall back to a static
 * greeting.
 */
export function getUserDisplayName(
  email: string | null | undefined,
): string | null {
  if (!email) {
    return null;
  }

  const localPart = email.split("@")[0] ?? "";
  const [firstSegment] = localPart.split(".").filter(Boolean);

  if (!firstSegment) {
    return null;
  }

  return firstSegment[0].toUpperCase() + firstSegment.slice(1).toLowerCase();
}
