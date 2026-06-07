const CHAPA_TITLE_MAX = 16;
const CHAPA_DESCRIPTION_MAX = 50;

/** Chapa allows letters, numbers, hyphens, underscores, spaces, and dots only. */
export function sanitizeChapaText(value: string, maxLength: number) {
  return value
    .replace(/[·•–—]/g, "-")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function chapaPaymentTitle() {
  return "School fees";
}

export function chapaPaymentDescription(feeLabel: string) {
  const cleaned = sanitizeChapaText(feeLabel, CHAPA_DESCRIPTION_MAX);
  return cleaned || "Semester tuition";
}

export function chapaPlatformPaymentTitle() {
  return sanitizeChapaText("EduSync SMS", CHAPA_TITLE_MAX) || "EduSync";
}

export function chapaPlatformPaymentDescription(
  studentCount: number,
  pricePerStudent: number
) {
  const raw = `${studentCount} students at ${pricePerStudent} ETB each`;
  const cleaned = sanitizeChapaText(raw, CHAPA_DESCRIPTION_MAX);
  return cleaned || "School subscription";
}

export function formatChapaErrorMessage(message: unknown, fallback = "Could not start Chapa checkout.") {
  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (message && typeof message === "object") {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(message as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string" && item.trim()) {
            parts.push(item);
          }
        }
      } else if (typeof value === "string" && value.trim()) {
        parts.push(`${key}: ${value}`);
      }
    }
    if (parts.length > 0) {
      const joined = parts.join(" ");
      if (/email/i.test(joined) || Object.keys(message as object).some((k) => /email/i.test(k))) {
        return "A valid email address is required for Chapa checkout.";
      }
      return joined;
    }
  }

  return fallback;
}
