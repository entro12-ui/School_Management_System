"use client";

import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

const DEMO_ACCOUNTS = [
  { email: "superadmin@school.et", role: "Super Admin" },
  { email: "admin.addis@school.et", role: "Branch Admin" },
  { email: "registrar.addis@school.et", role: "Registrar" },
  { email: "teacher.addis@school.et", role: "Teacher" },
  { email: "finance.addis@school.et", role: "Finance" },
  { email: "library.addis@school.et", role: "Librarian" },
  { email: "hr.addis@school.et", role: "HR" },
  { email: "parent@school.et", role: "Parent" },
  { email: "student@school.et", role: "Student (KG)" },
  { email: "student.grade10@school.et", role: "Student (G10)" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@school.et");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        <p className="text-sm text-indigo-200">Demo password: demo1234</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <Link href="/" className="mb-8 text-sm text-indigo-600 hover:underline">
          ← Back to home
        </Link>
        <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
        <p className="mt-1 text-slate-500">Access your role-based portal</p>

        <p className="mt-4 text-sm text-slate-600">
          <strong>Demo accounts</strong> (quick-login chips below): password{" "}
          <code className="rounded bg-slate-100 px-1">demo1234</code>
          <br />
          <strong>Enrolled users</strong>: sign in with the one-time password from the registrar
          enrollment sheet, then set a new password.{" "}
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-8">
          <p className="text-xs font-medium uppercase text-slate-400">Quick demo login</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => setEmail(acc.email)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
