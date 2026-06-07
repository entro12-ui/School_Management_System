import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SchoolSuperAdminAccountForm } from "@/components/platform/school-super-admin-account-form";
import { getSchoolSignupAccountContext } from "@/lib/services/platform-provisioning";

export const dynamic = "force-dynamic";

export default async function SchoolAccountSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signup = await getSchoolSignupAccountContext(id);
  if (!signup) notFound();

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
        <Link href="/register/school" className="text-sm text-slate-500 hover:text-indigo-600">
          ← School registration
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">{signup.schoolName}</h1>
        <p className="mt-2 text-slate-600">Finish setting up your school workspace</p>

        <div className="mt-8">
          <Suspense fallback={null}>
            <SchoolSuperAdminAccountForm signup={signup} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
