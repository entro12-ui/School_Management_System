"use client";

import { useMemo, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, type DemoAccount } from "@/lib/demo-accounts";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const router = useRouter();
  const [selectedEmail, setSelectedEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedRole = useMemo(
    () => DEMO_ACCOUNTS.find((a) => a.email === selectedEmail)?.role ?? "User",
    [selectedEmail]
  );

  function pickDemo(acc: DemoAccount) {
    setSelectedEmail(acc.email);
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      const statusRes = await fetch(
        `/api/register/status?email=${encodeURIComponent(email)}`
      );
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (status.status === "pending") {
          setError(
            status.role === "HR_MANAGER"
              ? `Your HR Manager application at ${status.branchName} is awaiting admin approval.`
              : `Your registrar office application at ${status.branchName} is awaiting admin approval.`
          );
          return;
        }
        if (status.status === "rejected") {
          setError(
            `Your registration was rejected${status.reason ? `: ${status.reason}` : ""}. You may register again.`
          );
          return;
        }
      }
      setError(
        "Invalid email or password. Demo password is demo1234. Enrolled users: use OTP from registrar."
      );
      return;
    }

    const session = await getSession();
    if (session?.user?.mustChangePassword) {
      router.push("/change-password");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-violet-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-violet-400/25 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-amber-300/25 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-rose-300/20 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3 sm:max-w-xl">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 shadow-md shadow-indigo-300/50">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">EduSync SMS</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
            Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-53px)] max-w-lg flex-col justify-center px-4 py-8 sm:max-w-xl">
        <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-2xl shadow-indigo-200/40 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 px-6 py-5 text-white">
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              <Sparkles className="h-3.5 w-3.5" />
              Sign in
            </div>
            <h1 className="mt-1 text-xl font-bold">Access your portal</h1>
            <p className="mt-1 text-sm text-white/85">
              Tap a demo role below — email & password fill in instantly
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="login-email" className="text-xs font-semibold text-slate-600">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    const m = DEMO_ACCOUNTS.find((a) => a.email === e.target.value);
                    if (m) setSelectedEmail(m.email);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="text-xs font-semibold text-slate-600">
                  Password
                </label>
                <PasswordInput
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  wrapperClassName="mt-1"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full rounded-lg" disabled={loading}>
                {loading ? "Signing in…" : `Sign in · ${selectedRole}`}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick demo
                </p>
                <span className="font-mono text-[10px] font-semibold text-indigo-600">
                  pwd {DEMO_PASSWORD}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const active = selectedEmail === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => pickDemo(acc)}
                      className={cn(
                        "rounded-lg border px-2 py-1.5 text-left text-[11px] font-semibold leading-tight transition",
                        active
                          ? "border-indigo-500 bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-300/40"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800"
                      )}
                    >
                      {acc.role}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-500">
              <Link href="/register" className="font-medium text-indigo-600 hover:underline">
                Apply as staff
              </Link>
              {" · "}
              OTP for enrolled users
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
