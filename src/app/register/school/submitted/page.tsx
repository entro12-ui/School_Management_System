import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { PLATFORM_STUDENT_PRICE_ETB } from "@/lib/platform/billing";

export const dynamic = "force-dynamic";

export default async function SchoolSignupSubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

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
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-2xl font-bold text-slate-900">Application submitted</h1>
          <p className="mt-2 text-slate-600">
            Our platform team will review your school application. Once approved, pay{" "}
            <strong>{PLATFORM_STUDENT_PRICE_ETB} ETB per student</strong>, then create your super
            admin account to sign in and manage branches.
          </p>
          {id && (
            <p className="mt-4 text-sm text-slate-500">
              Reference: <span className="font-mono text-slate-700">{id}</span>
            </p>
          )}
          {id && (
            <Link
              href={`/register/school/pay/${id}`}
              className="mt-6 inline-flex text-sm font-medium text-indigo-600 hover:underline"
            >
              Check payment status →
            </Link>
          )}
        </div>
        <Link href="/" className="mt-8 inline-block text-sm text-slate-500 hover:text-indigo-600">
          ← Back to home
        </Link>
      </main>
    </div>
  );
}
