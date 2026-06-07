"use client";

import { useState, useTransition } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { changePassword } from "@/lib/actions/enrollment";
import { ROLE_HOME } from "@/lib/auth/roles";
import { GraduationCap } from "lucide-react";

export function ChangePasswordForm() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-600">Loading…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-premium-canvas px-4">
        <div className="rounded-xl border border-premium-ink/8 bg-white p-8 text-center shadow-[var(--shadow-premium-sm)]">
          <p className="text-premium-ink/65">Please sign in first.</p>
          <Link href="/login" className="mt-4 inline-block text-premium-accent hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.success) {
        await update({ mustChangePassword: false });
        const home = session?.user?.role
          ? ROLE_HOME[session.user.role]
          : "/login";
        router.push(home);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-premium-canvas px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-premium-ink/8 bg-white p-8 shadow-[var(--shadow-premium-md)]">
        <div className="mb-6 flex items-center gap-2">
          <GraduationCap className="h-7 w-7 shrink-0 text-premium-accent" strokeWidth={1.75} />
          <span className="text-lg font-semibold text-premium-ink">Set your password</span>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-premium-ink/65">
          You signed in with a <strong>one-time password</strong> from your branch admin.
          Enter that OTP as the current password, then choose a new password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Current password (one-time password) *">
            <PasswordInput
              name="currentPassword"
              required
              autoComplete="current-password"
              placeholder="Paste OTP from approval email"
            />
          </Field>
          <Field label="New password (min. 8 characters) *">
            <PasswordInput
              name="newPassword"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm new password *">
            <PasswordInput
              name="confirmPassword"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Update password & continue"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-indigo-600"
        >
          Sign out
        </button>

        <Link
          href="/login"
          className="mt-2 block text-center text-xs text-slate-400 hover:underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
