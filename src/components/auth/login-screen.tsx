"use client";

import { useMemo, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Network,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  DEMO_ACCOUNTS,
  DEMO_GROUP_LABELS,
  DEMO_PASSWORD,
  type DemoAccount,
} from "@/lib/demo-accounts";
import { cn } from "@/lib/utils";

type DemoFilter = "all" | DemoAccount["group"];

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@school.et");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAllDemoPasswords, setShowAllDemoPasswords] = useState(true);
  const [demoFilter, setDemoFilter] = useState<DemoFilter>("all");
  const [demoSearch, setDemoSearch] = useState("");

  const filteredDemos = useMemo(() => {
    const q = demoSearch.trim().toLowerCase();
    return DEMO_ACCOUNTS.filter((acc) => {
      if (demoFilter !== "all" && acc.group !== demoFilter) return false;
      if (!q) return true;
      return (
        acc.role.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q)
      );
    });
  }, [demoFilter, demoSearch]);

  function selectDemo(acc: DemoAccount) {
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
        "Invalid email or password. Demo accounts use demo1234. Enrolled users must use the one-time password from the registrar sheet."
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
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200/60">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">EduSync SMS</p>
              <p className="text-[11px] text-slate-500">KG–12 · Multi-Branch</p>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="hidden font-medium text-slate-600 hover:text-indigo-600 sm:inline">
              Home
            </Link>
            <Link href="/register" className="font-medium text-indigo-600 hover:underline">
              Register
            </Link>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-[calc(100vh-57px)] max-w-6xl flex-col lg:flex-row">
        {/* Brand panel */}
        <aside className="hidden w-full shrink-0 flex-col justify-between bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-10 text-white lg:flex lg:w-[42%] lg:min-h-[calc(100vh-57px)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              Role-based portals
            </div>
            <h1 className="mt-6 text-3xl font-bold leading-tight">
              Sign in to your workspace
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-100">
              Central office, branch staff, and family portals — one account per role,
              synced across Addis Ababa, Bishoftu, and more.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-indigo-50">
              {[
                "Demo accounts ready for testing (password below)",
                "Enrolled staff use OTP from registrar sheet",
                "First login may require password change",
              ].map((text) => (
                <li key={text} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <KeyRound className="h-4 w-4" />
                Demo password
              </div>
              <p className="mt-2 font-mono text-lg font-bold tracking-wide">
                {DEMO_PASSWORD}
              </p>
              <p className="mt-1 text-xs text-indigo-200">
                Same for all quick-login accounts on the right.
              </p>
            </div>
            <Link
              href="/#organization"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-100 hover:text-white"
            >
              <Network className="h-4 w-4" />
              How the system works
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </aside>

        {/* Form + demo panel */}
        <main className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:py-10 lg:pl-10 lg:pr-12">
          <div className="lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Sign in
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Access your portal</h2>
            <p className="mt-1 text-sm text-slate-500">
              Demo password:{" "}
              <span className="font-mono font-semibold text-slate-800">{DEMO_PASSWORD}</span>
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8 lg:mt-0">
            <div className="hidden lg:block">
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="mt-1 text-slate-500">Email and password for your role portal</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="login-email" className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
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
                <div
                  role="alert"
                  className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-500">
              Enrolled at school? Use the{" "}
              <strong className="text-slate-700">one-time password</strong> from your enrollment
              sheet.{" "}
              <Link href="/register" className="font-medium text-indigo-600 hover:underline">
                Apply as staff
              </Link>
            </p>
          </div>

          {/* Quick demo */}
          <section className="mt-8 flex min-h-0 flex-1 flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick demo login
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  Click a row — fills email & password
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllDemoPasswords((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                {showAllDemoPasswords ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" />
                    Hide passwords
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" />
                    Show passwords
                  </>
                )}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "central", "branch", "family"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDemoFilter(key)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    demoFilter === key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                  )}
                >
                  {key === "all" ? "All" : DEMO_GROUP_LABELS[key]}
                </button>
              ))}
            </div>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={demoSearch}
                onChange={(e) => setDemoSearch(e.target.value)}
                placeholder="Filter by role or email…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="max-h-[min(22rem,50vh)] overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Role</th>
                      <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Email</th>
                      <th className="px-3 py-2.5 font-semibold">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredDemos.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-8 text-center text-slate-500">
                          No accounts match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredDemos.map((acc) => {
                        const selected = email === acc.email;
                        return (
                          <tr
                            key={acc.email}
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-indigo-50/80",
                              selected && "bg-indigo-50"
                            )}
                            onClick={() => selectDemo(acc)}
                          >
                            <td className="px-3 py-2.5">
                              <span className="font-medium text-slate-800">{acc.role}</span>
                              <span className="mt-0.5 block text-[10px] text-slate-400 md:hidden">
                                {acc.email}
                              </span>
                              <span className="mt-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 lg:hidden">
                                {DEMO_GROUP_LABELS[acc.group]}
                              </span>
                            </td>
                            <td className="hidden px-3 py-2.5 text-slate-600 md:table-cell">
                              {acc.email}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-slate-700">
                              {showAllDemoPasswords ? acc.password : "••••••••"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
              {filteredDemos.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => selectDemo(acc)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition",
                    email === acc.email
                      ? "border-indigo-400 bg-indigo-50 font-medium text-indigo-800"
                      : "border-slate-200 text-slate-600 hover:border-indigo-200"
                  )}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </section>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Building2 className="h-3.5 w-3.5" />
            <Link href="/" className="hover:text-indigo-600">
              ← Back to home
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
