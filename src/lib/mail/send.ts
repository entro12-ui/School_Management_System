import nodemailer from "nodemailer";
import { getAppBaseUrl } from "@/lib/chapa/config";

export function getMailFromAddress() {
  const raw = process.env.MAIL_FROM?.trim() || process.env.SMTP_USER?.trim();
  if (!raw) return "EduSync SMS <onboarding@resend.dev>";
  if (raw.includes("<")) return raw;
  return `EduSync SMS <${raw}>`;
}

function getMailBcc() {
  return process.env.MAIL_BCC?.trim() || process.env.MAIL_TO?.trim() || undefined;
}

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

export function isMailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() || smtpConfigured());
}

type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendMailResult =
  | { ok: true; sent: true; provider: "smtp" | "resend" }
  | { ok: true; sent: false; logged: true }
  | { ok: false; error: string };

async function sendViaSmtp(input: SendMailInput): Promise<SendMailResult | null> {
  if (!smtpConfigured()) return null;

  const host = process.env.SMTP_HOST!.trim();
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: getMailFromAddress(),
      to: input.to,
      bcc: getMailBcc(),
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { ok: true, sent: true, provider: "smtp" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SMTP send failed.",
    };
  }
}

async function sendViaResend(input: SendMailInput): Promise<SendMailResult | null> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) return null;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getMailFromAddress(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      return {
        ok: false,
        error: body?.message ?? `Resend returned ${response.status}.`,
      };
    }

    return { ok: true, sent: true, provider: "resend" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not reach Resend.",
    };
  }
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const smtpResult = await sendViaSmtp(input);
  if (smtpResult) return smtpResult;

  const resendResult = await sendViaResend(input);
  if (resendResult) return resendResult;

  console.info("[mail] No email provider configured — preview:");
  console.info(`  To: ${input.to}`);
  console.info(`  Subject: ${input.subject}`);
  console.info(`  Body:\n${input.text}`);
  console.info("  Add SMTP_* or RESEND_API_KEY to .env (see .env.example), then restart.");

  return { ok: true, sent: false, logged: true };
}

export function buildSchoolPaymentLink(signupRequestId: string) {
  return `${getAppBaseUrl()}/register/school/pay/${signupRequestId}`;
}
