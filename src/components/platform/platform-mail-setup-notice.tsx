import { isMailConfigured } from "@/lib/mail/send";

export function PlatformMailSetupNotice() {
  if (isMailConfigured()) return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-semibold">Email not configured</p>
      <p className="mt-1">
        Add one of these to your <code>.env</code> file, then restart <code>npm run dev</code>:
      </p>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
        Option A — Gmail / SMTP (recommended)
      </p>
      <pre className="mt-1 overflow-x-auto rounded-lg bg-white/80 p-3 text-xs text-slate-800">
{`SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="your-gmail-app-password"
MAIL_FROM="EduSync SMS <your@gmail.com>"`}
      </pre>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-800">
        Option B — Resend API
      </p>
      <pre className="mt-1 overflow-x-auto rounded-lg bg-white/80 p-3 text-xs text-slate-800">
{`RESEND_API_KEY="re_your_key"
MAIL_FROM="EduSync SMS <onboarding@resend.dev>"`}
      </pre>

      <p className="mt-2 text-xs text-amber-800">
        Until email is set up, use <strong>Copy payment link</strong> or{" "}
        <strong>Open payment page</strong> in the table below.
      </p>
    </div>
  );
}
