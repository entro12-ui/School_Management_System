export const PARENT_COMMUNICATION_MESSAGE_TYPES = [
  "progress_report",
  "attendance_alert",
  "fee_alert",
  "positive_update",
] as const;

export type ParentCommunicationMessageType =
  (typeof PARENT_COMMUNICATION_MESSAGE_TYPES)[number];

export const PARENT_COMMUNICATION_TONES = ["warm", "formal"] as const;

export type ParentCommunicationTone = (typeof PARENT_COMMUNICATION_TONES)[number];

export const PARENT_COMMUNICATION_LANGUAGES = ["en", "am", "om"] as const;

export type ParentCommunicationLanguage =
  (typeof PARENT_COMMUNICATION_LANGUAGES)[number];

export const PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS: Record<
  ParentCommunicationMessageType,
  string
> = {
  progress_report: "Progress report",
  attendance_alert: "Attendance alert",
  fee_alert: "Fee alert",
  positive_update: "Positive update",
};

export const PARENT_COMMUNICATION_TONE_LABELS: Record<
  ParentCommunicationTone,
  string
> = {
  warm: "Warm",
  formal: "Formal",
};

export const PARENT_COMMUNICATION_LANGUAGE_LABELS: Record<
  ParentCommunicationLanguage,
  string
> = {
  en: "English",
  am: "Amharic",
  om: "Afaan Oromo",
};
