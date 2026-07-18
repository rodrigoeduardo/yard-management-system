/**
 * Minimal shape of a Supabase auth user needed to derive a display name.
 */
export interface DisplayNameSource {
  email?: string | null;
  user_metadata?: { display_name?: unknown } | null;
}

/**
 * Derives a display name for the dashboard greeting. Prefers
 * `user_metadata.display_name` when it is set to a non-empty string;
 * otherwise falls back to a name derived from the user's email local
 * part (e.g. "rafael.silva@example.com" -> "Rafael"). Returns null when
 * neither source yields a name, so callers can fall back to a static
 * greeting.
 */
export function getUserDisplayName(
  user: DisplayNameSource | null | undefined,
): string | null {
  const metadataName = user?.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }

  return getEmailDisplayName(user?.email);
}

function getEmailDisplayName(
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
