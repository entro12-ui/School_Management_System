/** Chapa expects a standard ASCII email (Laravel email rule). */
const CHAPA_EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function resolveChapaEmail(email?: string | null): string | null {
  if (!email) return null;

  let normalized = email
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\x21-\x7E]/g, "");

  if (!normalized || !CHAPA_EMAIL_REGEX.test(normalized)) {
    return null;
  }

  return normalized.slice(0, 100);
}

export function resolveChapaEmailOrFallback(
  email?: string | null,
  fallback = "payments@edusync.et"
): string {
  return resolveChapaEmail(email) ?? fallback;
}
