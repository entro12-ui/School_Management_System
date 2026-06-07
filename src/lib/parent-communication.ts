export const PARENT_COMMUNICATION_MESSAGE_TYPES = [
  "progress_report",
  "attendance_alert",
  "fee_alert",
  "positive_update",
  "meeting_request",
] as const;

export type ParentCommunicationMessageType =
  (typeof PARENT_COMMUNICATION_MESSAGE_TYPES)[number];

export const PARENT_COMMUNICATION_TONES = ["warm", "formal"] as const;

export type ParentCommunicationTone = (typeof PARENT_COMMUNICATION_TONES)[number];

/** Supported draft content languages (English & Amharic). */
export const PARENT_COMMUNICATION_CONTENT_LANGUAGES = ["en", "am"] as const;

export type ParentCommunicationContentLanguage =
  (typeof PARENT_COMMUNICATION_CONTENT_LANGUAGES)[number];

/** @deprecated Use PARENT_COMMUNICATION_CONTENT_LANGUAGES — kept for API compatibility. */
export const PARENT_COMMUNICATION_LANGUAGES = PARENT_COMMUNICATION_CONTENT_LANGUAGES;

export type ParentCommunicationLanguage = ParentCommunicationContentLanguage;

export const PARENT_COMMUNICATION_CONTENT_LANGUAGE_LABELS: Record<
  ParentCommunicationContentLanguage,
  string
> = {
  en: "English",
  am: "Amharic",
};

export const PARENT_COMMUNICATION_LANGUAGE_LABELS =
  PARENT_COMMUNICATION_CONTENT_LANGUAGE_LABELS;

/** For marketing copy — e.g. "English & Amharic". */
export const PARENT_COMMUNICATION_CONTENT_LANGUAGE_SUMMARY =
  PARENT_COMMUNICATION_CONTENT_LANGUAGES.map(
    (code) => PARENT_COMMUNICATION_CONTENT_LANGUAGE_LABELS[code]
  ).join(" & ");

/** For marketing copy — e.g. "English and Amharic". */
export const PARENT_COMMUNICATION_CONTENT_LANGUAGE_AND =
  PARENT_COMMUNICATION_CONTENT_LANGUAGES.map(
    (code) => PARENT_COMMUNICATION_CONTENT_LANGUAGE_LABELS[code]
  ).join(" and ");

export const PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS: Record<
  ParentCommunicationMessageType,
  string
> = {
  progress_report: "Progress report",
  attendance_alert: "Attendance alert",
  fee_alert: "Fee alert",
  positive_update: "Positive update",
  meeting_request: "Meeting request",
};

export const PARENT_COMMUNICATION_TONE_LABELS: Record<
  ParentCommunicationTone,
  string
> = {
  warm: "Warm",
  formal: "Formal",
};

export function isParentCommunicationContentLanguage(
  value: string
): value is ParentCommunicationContentLanguage {
  return (PARENT_COMMUNICATION_CONTENT_LANGUAGES as readonly string[]).includes(value);
}
