import { prisma } from "@/lib/prisma";

export const SYSTEM_SETTING_KEYS = [
  "schoolName",
  "defaultCountry",
  "academicCalendar",
  "otpExpiryDays",
  "requirePasswordChange",
  "smsNotifications",
  "smsSenderId",
  "smsProvider",
  "smsApiKey",
] as const;

export type SystemSettingKey = (typeof SYSTEM_SETTING_KEYS)[number];

export type SystemSettings = {
  schoolName: string;
  defaultCountry: string;
  academicCalendar: string;
  otpExpiryDays: number;
  requirePasswordChange: boolean;
  smsNotifications: boolean;
  smsSenderId: string;
  smsProvider: string;
  smsApiKey: string;
  hasSmsApiKey: boolean;
};

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  schoolName: "EduSync SMS",
  defaultCountry: "Ethiopia",
  academicCalendar: "September – June",
  otpExpiryDays: 7,
  requirePasswordChange: true,
  smsNotifications: false,
  smsSenderId: "EDUSYNC",
  smsProvider: "none",
  smsApiKey: "",
  hasSmsApiKey: false,
};

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    if (!Number.isNaN(n)) return n;
  }
  return fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export async function ensureSystemSettings() {
  const entries: { key: SystemSettingKey; value: string | number | boolean }[] = [
    { key: "schoolName", value: DEFAULT_SYSTEM_SETTINGS.schoolName },
    { key: "defaultCountry", value: DEFAULT_SYSTEM_SETTINGS.defaultCountry },
    { key: "academicCalendar", value: DEFAULT_SYSTEM_SETTINGS.academicCalendar },
    { key: "otpExpiryDays", value: DEFAULT_SYSTEM_SETTINGS.otpExpiryDays },
    { key: "requirePasswordChange", value: DEFAULT_SYSTEM_SETTINGS.requirePasswordChange },
    { key: "smsNotifications", value: DEFAULT_SYSTEM_SETTINGS.smsNotifications },
    { key: "smsSenderId", value: DEFAULT_SYSTEM_SETTINGS.smsSenderId },
    { key: "smsProvider", value: DEFAULT_SYSTEM_SETTINGS.smsProvider },
  ];

  const existing = await prisma.systemSetting.findMany({
    where: { key: { in: entries.map((e) => e.key) } },
    select: { key: true },
  });
  const have = new Set(existing.map((r) => r.key));
  const missing = entries.filter((e) => !have.has(e.key));
  if (missing.length === 0) return;

  await prisma.systemSetting.createMany({
    data: missing.map(({ key, value }) => ({ key, value })),
    skipDuplicates: true,
  });
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: [...SYSTEM_SETTING_KEYS] } },
  });

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  const apiKey = readString(map.smsApiKey, "");

  return {
    schoolName: readString(map.schoolName, DEFAULT_SYSTEM_SETTINGS.schoolName),
    defaultCountry: readString(map.defaultCountry, DEFAULT_SYSTEM_SETTINGS.defaultCountry),
    academicCalendar: readString(map.academicCalendar, DEFAULT_SYSTEM_SETTINGS.academicCalendar),
    otpExpiryDays: readNumber(map.otpExpiryDays, DEFAULT_SYSTEM_SETTINGS.otpExpiryDays),
    requirePasswordChange: readBoolean(
      map.requirePasswordChange,
      DEFAULT_SYSTEM_SETTINGS.requirePasswordChange
    ),
    smsNotifications: readBoolean(map.smsNotifications, DEFAULT_SYSTEM_SETTINGS.smsNotifications),
    smsSenderId: readString(map.smsSenderId, DEFAULT_SYSTEM_SETTINGS.smsSenderId),
    smsProvider: readString(map.smsProvider, DEFAULT_SYSTEM_SETTINGS.smsProvider),
    smsApiKey: "",
    hasSmsApiKey: apiKey.length > 0,
  };
}

export async function upsertSystemSetting(key: SystemSettingKey, value: string | number | boolean) {
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

/** Single-row read for login — avoids loading all system settings. */
export async function getOtpExpiryDays(): Promise<number> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: "otpExpiryDays" },
    select: { value: true },
  });
  if (!row) return DEFAULT_SYSTEM_SETTINGS.otpExpiryDays;
  return readNumber(row.value, DEFAULT_SYSTEM_SETTINGS.otpExpiryDays);
}
