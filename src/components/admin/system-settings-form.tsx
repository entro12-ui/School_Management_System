"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { updateSystemSettings } from "@/lib/actions/admin-settings";
import type { SystemSettings } from "@/lib/system-settings";

export function SystemSettingsForm({ settings }: { settings: SystemSettings }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await updateSystemSettings(fd);
          if (res.success) setMessage(res.message);
          else setError(res.error ?? "Could not save settings");
        });
      }}
    >
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      <section>
        <h2 className="font-semibold text-slate-900">System configuration</h2>
        <p className="mt-1 text-sm text-slate-500">
          Values stored in the database and applied across all branches.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="School system name">
            <Input
              name="schoolName"
              defaultValue={settings.schoolName}
              required
              disabled={pending}
            />
          </Field>
          <Field label="Country / region">
            <Input
              name="defaultCountry"
              defaultValue={settings.defaultCountry}
              required
              disabled={pending}
            />
          </Field>
          <Field label="Academic calendar">
            <Input
              name="academicCalendar"
              defaultValue={settings.academicCalendar}
              placeholder="September – June"
              required
              disabled={pending}
            />
          </Field>
          <Field label="OTP valid (days)">
            <Input
              name="otpExpiryDays"
              type="number"
              min={1}
              max={90}
              defaultValue={settings.otpExpiryDays}
              required
              disabled={pending}
            />
          </Field>
          <Field label="Require password change after OTP">
            <Select
              name="requirePasswordChange"
              defaultValue={settings.requirePasswordChange ? "true" : "false"}
              disabled={pending}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
        </div>
      </section>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
        <h2 className="font-semibold text-slate-900">SMS notifications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure outbound SMS for fee reminders, attendance alerts, and announcements.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="SMS notifications">
            <Select
              name="smsNotifications"
              defaultValue={settings.smsNotifications ? "true" : "false"}
              disabled={pending}
            >
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </Select>
          </Field>
          <Field label="SMS sender ID">
            <Input
              name="smsSenderId"
              defaultValue={settings.smsSenderId}
              placeholder="EDUSYNC"
              maxLength={20}
              disabled={pending}
            />
          </Field>
          <Field label="SMS provider">
            <Select name="smsProvider" defaultValue={settings.smsProvider} disabled={pending}>
              <option value="none">None (log only)</option>
              <option value="africastalking">Africa&apos;s Talking</option>
              <option value="twilio">Twilio</option>
              <option value="custom">Custom HTTP API</option>
            </Select>
          </Field>
          <Field label="SMS API key">
            <PasswordInput
              name="smsApiKey"
              placeholder={settings.hasSmsApiKey ? "•••••••• (leave blank to keep)" : "Enter API key"}
              autoComplete="off"
              disabled={pending}
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Advanced integration keys (webhook URLs, templates) are managed by your developer.
          Parent phone numbers from enrollment are used when SMS is enabled.
        </p>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
