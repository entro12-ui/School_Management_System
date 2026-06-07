import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { SchoolSignupForm } from "@/components/platform/school-signup-form";
import { PLATFORM_STUDENT_PRICE_ETB } from "@/lib/platform/billing";

export const dynamic = "force-dynamic";

export default function RegisterSchoolPage() {
  return (
    <div className="min-h-screen bg-premium-canvas">
      <header className="border-b border-premium-ink/8 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-portal-sidebar text-white">
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <span className="font-semibold text-premium-ink">EduSync SMS</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-premium-accent hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/" className="text-sm text-slate-500 hover:text-indigo-600">
          ← Back to home
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Register your school</h1>
        <p className="mt-2 text-slate-600">
          Apply to use EduSync SMS for your KG–12 school. After review, pay{" "}
          <strong>{PLATFORM_STUDENT_PRICE_ETB} ETB per student</strong> to activate your workspace
          and create your branches.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SchoolSignupForm />
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Staff roles (registrar, HR) apply separately after your school is active.
        </p>
      </main>
    </div>
  );
}
