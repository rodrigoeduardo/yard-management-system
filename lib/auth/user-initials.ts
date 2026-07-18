/**
 * Derives a two-letter avatar label from a user's email local part
 * (e.g. "rafael.silva@example.com" -> "RS"). Falls back gracefully when
 * the local part has no dot separator, or when no email is available.
 */
export function getUserInitials(email: string | null | undefined): string {
  if (!email) {
    return "U";
  }

  const localPart = email.split("@")[0] ?? "";
  if (!localPart) {
    return "U";
  }

  const segments = localPart.split(".").filter(Boolean);

  if (segments.length >= 2) {
    return (segments[0][0] + segments[1][0]).toUpperCase();
  }

  return segments[0].slice(0, 2).toUpperCase();
}
