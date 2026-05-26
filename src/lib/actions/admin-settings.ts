"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  type SystemSettingKey,
  upsertSystemSetting,
} from "@/lib/system-settings";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

const settingsSchema = z.object({
  schoolName: z.string().min(2, "School name is required").max(120),
  defaultCountry: z.string().min(2).max(80),
  academicCalendar: z.string().min(3).max(120),
  otpExpiryDays: z.coerce.number().int().min(1).max(90),
  requirePasswordChange: z.enum(["true", "false"]),
  smsNotifications: z.enum(["true", "false"]),
  smsSenderId: z.string().max(20).optional(),
  smsProvider: z.enum(["none", "africastalking", "twilio", "custom"]),
  smsApiKey: z.string().max(200).optional(),
});

export async function updateSystemSettings(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
    return { success: false, error: "Only super admin can change system settings." };
  }

  const parsed = settingsSchema.safeParse({
    schoolName: formData.get("schoolName"),
    defaultCountry: formData.get("defaultCountry"),
    academicCalendar: formData.get("academicCalendar"),
    otpExpiryDays: formData.get("otpExpiryDays"),
    requirePasswordChange: formData.get("requirePasswordChange"),
    smsNotifications: formData.get("smsNotifications"),
    smsSenderId: formData.get("smsSenderId") || "",
    smsProvider: formData.get("smsProvider"),
    smsApiKey: formData.get("smsApiKey") || "",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Invalid settings" };
  }

  const d = parsed.data;
  const updates: { key: SystemSettingKey; value: string | number | boolean }[] = [
    { key: "schoolName", value: d.schoolName.trim() },
    { key: "defaultCountry", value: d.defaultCountry.trim() },
    { key: "academicCalendar", value: d.academicCalendar.trim() },
    { key: "otpExpiryDays", value: d.otpExpiryDays },
    { key: "requirePasswordChange", value: d.requirePasswordChange === "true" },
    { key: "smsNotifications", value: d.smsNotifications === "true" },
    { key: "smsSenderId", value: (d.smsSenderId ?? "").trim().toUpperCase() },
    { key: "smsProvider", value: d.smsProvider },
  ];

  for (const { key, value } of updates) {
    await upsertSystemSetting(key, value);
  }

  const newApiKey = (d.smsApiKey ?? "").trim();
  if (newApiKey) {
    await upsertSystemSetting("smsApiKey", newApiKey);
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      action: "SETTINGS_UPDATE",
      entity: "SystemSetting",
      metadata: {
        schoolName: d.schoolName,
        smsNotifications: d.smsNotifications === "true",
        smsProvider: d.smsProvider,
      },
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");

  return { success: true, message: "System settings saved." };
}
