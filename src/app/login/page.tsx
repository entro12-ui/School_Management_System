"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

const DEMO_PASSWORD = "demo1234";

const DEMO_ACCOUNTS = [
  { email: "superadmin@school.et", role: "Super Admin", password: DEMO_PASSWORD },
  { email: "admin.addis@school.et", role: "Branch Admin", password: DEMO_PASSWORD },
  { email: "registrar.addis@school.et", role: "Registrar", password: DEMO_PASSWORD },
  { email: "teacher.addis@school.et", role: "Teacher", password: DEMO_PASSWORD },
  { email: "finance.addis@school.et", role: "Finance", password: DEMO_PASSWORD },
  { email: "library.addis@school.et", role: "Librarian", password: DEMO_PASSWORD },
  { email: "hr.addis@school.et", role: "HR Manager", password: DEMO_PASSWORD },
  { email: "parent@school.et", role: "Parent", password: DEMO_PASSWORD },
  { email: "student@school.et", role: "Student (KG)", password: DEMO_PASSWORD },
  { email: "student.grade10@school.et", role: "Student (G10)", password: DEMO_PASSWORD },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@school.et");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAllDemoPasswords, setShowAllDemoPasswords] = useState(true);

  function selectDemo(acc: (typeof DEMO_ACCOUNTS)[number]) {
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
        "Invalid email or password. Demo staff use password demo1234. Enrolled users must use the one-time password from the registrar sheet."
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
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-indigo-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            <span className="text-xl font-bold">EduSync SMS</span>
          </div>
          <h1 className="mt-12 text-3xl font-bold leading-tight">
            Multi-branch KG–12 management for Ethiopia
          </h1>
          <p className="mt-4 text-indigo-100">
            Super Admin central office with real-time sync across Addis Ababa,
            Bishoftu, and additional branches.
          </p>
        </div>
        <p className="text-sm text-indigo-200">
          All demo accounts use password: <strong>{DEMO_PASSWORD}</strong>
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <Link href="/" className="mb-8 text-sm text-indigo-600 hover:underline">
          ← Back to home
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
        <p className="mt-1 text-slate-500">Access your role-based portal</p>

        <p className="mt-4 text-sm text-slate-600">
          <strong>Demo accounts</strong> — click a row or chip below (email + password filled).
          <br />
          <strong>Enrolled users</strong>: one-time password from the registrar sheet.{" "}
          <Link href="/register" className="font-medium text-indigo-600 hover:underline">
            Apply to join registrar office
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              wrapperClassName="mt-1"
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase text-slate-400">Quick demo login</p>
            <button
              type="button"
              onClick={() => setShowAllDemoPasswords((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
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

          <p className="mt-2 text-xs text-slate-500">
            Click any row to fill email and password. All demos use{" "}
            <span className="font-mono font-medium text-slate-700">
              {showAllDemoPasswords ? DEMO_PASSWORD : "••••••••"}
            </span>
            .
          </p>

          <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => selectDemo(acc)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {acc.role}
                {showAllDemoPasswords && (
                  <span className="ml-1 font-mono text-slate-400">· {acc.password}</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[320px] text-left text-xs">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="hidden px-3 py-2 font-medium sm:table-cell">Email</th>
                  <th className="px-3 py-2 font-medium">Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {DEMO_ACCOUNTS.map((acc) => {
                  const selected = email === acc.email;
                  return (
                    <tr
                      key={acc.email}
                      className={`cursor-pointer transition-colors hover:bg-indigo-50 ${
                        selected ? "bg-indigo-50/80" : ""
                      }`}
                      onClick={() => selectDemo(acc)}
                    >
                      <td className="px-3 py-2">
                        <span className="font-medium text-slate-800">{acc.role}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-400 sm:hidden">
                          {acc.email}
                        </span>
                      </td>
                      <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">
                        {acc.email}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-700">
                        {showAllDemoPasswords ? acc.password : "••••••••"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
