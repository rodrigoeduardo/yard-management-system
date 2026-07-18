import type { DisplayNameSource } from "./user-display-name";

/**
 * Derives a two-letter avatar label. Prefers initials from
 * `user_metadata.display_name` when it is set to a non-empty string
 * (e.g. "Rafael Moreira" -> "RM"); otherwise falls back to initials
 * derived from the user's email local part
 * (e.g. "rafael.silva@example.com" -> "RS").
 */
export function getUserInitials(
  user: DisplayNameSource | null | undefined,
): string {
  const metadataName = user?.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return getNameInitials(metadataName.trim());
  }

  return getEmailInitials(user?.email);
}

function getNameInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return "U";
}

function getEmailInitials(email: string | null | undefined): string {
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
