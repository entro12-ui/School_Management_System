import {
  PARENT_COMMUNICATION_LANGUAGES,
  PARENT_COMMUNICATION_MESSAGE_TYPES,
  PARENT_COMMUNICATION_TONES,
  type ParentCommunicationLanguage,
  type ParentCommunicationMessageType,
  type ParentCommunicationTone,
} from "@/lib/parent-communication";

const STORAGE_KEY = "parent-communication-bot-prefs";

export type ParentCommunicationBotPrefs = {
  childId?: string;
  messageType?: ParentCommunicationMessageType;
  language?: ParentCommunicationLanguage;
  tone?: ParentCommunicationTone;
};

function isMessageType(value: string): value is ParentCommunicationMessageType {
  return (PARENT_COMMUNICATION_MESSAGE_TYPES as readonly string[]).includes(value);
}

function isLanguage(value: string): value is ParentCommunicationLanguage {
  return (PARENT_COMMUNICATION_LANGUAGES as readonly string[]).includes(value);
}

function isTone(value: string): value is ParentCommunicationTone {
  return (PARENT_COMMUNICATION_TONES as readonly string[]).includes(value);
}

export function readParentCommunicationBotPrefs(): ParentCommunicationBotPrefs {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      childId: typeof parsed.childId === "string" ? parsed.childId : undefined,
      messageType:
        typeof parsed.messageType === "string" && isMessageType(parsed.messageType)
          ? parsed.messageType
          : undefined,
      language:
        typeof parsed.language === "string" && isLanguage(parsed.language)
          ? parsed.language
          : undefined,
      tone:
        typeof parsed.tone === "string" && isTone(parsed.tone) ? parsed.tone : undefined,
    };
  } catch {
    return {};
  }
}

export function writeParentCommunicationBotPrefs(prefs: ParentCommunicationBotPrefs) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

export function resolveInitialChildId(
  childIds: string[],
  options: { urlChildId?: string | null; savedChildId?: string; defaultChildId?: string | null }
): string {
  const candidates = [
    options.urlChildId,
    options.savedChildId,
    options.defaultChildId ?? undefined,
    childIds[0],
  ];
  for (const id of candidates) {
    if (id && childIds.includes(id)) return id;
  }
  return "";
}
