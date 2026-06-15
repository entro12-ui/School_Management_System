"use client";

import { useEffect, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, GraduationCap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export function LoginScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "school-not-linked") {
      setError(
        "Your super admin account is not linked to a school yet. Complete school registration, payment, and account setup first."
      );
    }
  }, [searchParams]);

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
      try {
        const statusRes = await fetch(
          `/api/register/status?email=${encodeURIComponent(email)}`
        );
        if (statusRes.ok) {
          const status = await statusRes.json();
          if (status.status === "pending") {
            if (status.role === "SCHOOL_SUPER_ADMIN") {
              setError(
                `Your school application for ${status.schoolName} is awaiting platform admin approval.`
              );
              return;
            }
            setError(
              status.role === "HR_MANAGER"
                ? `Your HR Manager application at ${status.branchName} is awaiting admin approval.`
                : `Your registrar office application at ${status.branchName} is awaiting admin approval.`
            );
            return;
          }
          if (status.status === "pending_payment") {
            setError(
              `Your school application for ${status.schoolName} was approved. Complete payment: ${window.location.origin}${status.paymentUrl}`
            );
            return;
          }
          if (status.status === "pending_account") {
            setError(
              `Payment received for ${status.schoolName}. Create your super admin account: ${window.location.origin}${status.accountUrl}`
            );
            return;
          }
          if (status.status === "rejected") {
            setError(
              status.role === "SCHOOL_SUPER_ADMIN"
                ? `Your school application was rejected${status.reason ? `: ${status.reason}` : ""}. You may register again.`
                : `Your registration was rejected${status.reason ? `: ${status.reason}` : ""}. You may register again.`
            );
            return;
          }
        }
      } catch {
        // Status lookup is optional — don't surface as a console NetworkError
      }
      setError("Invalid email or password. Please check your credentials and try again.");
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
    <div className="min-h-screen bg-premium-canvas">
      <header className="border-b border-premium-ink/8 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-premium-accent text-white">
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <span className="text-sm font-semibold text-premium-ink">EduSync SMS</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-premium-accent hover:underline">
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-accent">
            Sign in
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-premium-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-premium-ink/55">
            Use the email and password your school provided.
          </p>
        </div>

        <div className="rounded-2xl border border-premium-ink/8 bg-white p-7 shadow-[var(--shadow-premium-md)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="text-sm font-medium text-premium-ink">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourschool.edu"
                className="mt-1.5 w-full rounded-lg border border-premium-ink/12 bg-premium-canvas/30 px-3 py-2.5 text-sm text-premium-ink transition focus:border-premium-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-premium-accent/15"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="text-sm font-medium text-premium-ink">
                Password
              </label>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                wrapperClassName="mt-1.5"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-premium-ink/5 px-3 py-2.5 text-sm text-premium-ink">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full rounded-lg bg-premium-accent py-2.5 font-semibold shadow-[0_4px_14px_rgb(13_105_96_/_0.35)] hover:bg-[#0a524b]"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-premium-ink/6 bg-premium-canvas/50 px-3 py-3 text-xs leading-relaxed text-premium-ink/55">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-premium-ink/35" strokeWidth={1.75} />
            <span>
              Students and parents may receive a one-time password from their registrar
              on first login.
            </span>
          </div>

          <p className="mt-5 text-center text-xs text-premium-ink/45">
            New staff?{" "}
            <Link href="/register" className="font-medium text-premium-accent hover:underline">
              Apply for an account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
