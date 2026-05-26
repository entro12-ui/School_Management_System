import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { HrManagerApplyForm } from "@/components/registration/hr-manager-apply-form";
import { RegistrationLayout } from "@/components/registration/registration-layout";
import { getPublicBranches } from "@/lib/services/registrations";

export const dynamic = "force-dynamic";

export default async function RegisterHrManagerPage() {
  const branches = await getPublicBranches();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold text-slate-900">EduSync SMS</span>
          </Link>
          <Link href="/login" className="text-sm text-indigo-600 hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <RegistrationLayout
          title="HR Manager application"
          description="Apply to lead Human Resources at a school branch. Your account is created only after branch admin or super admin approval."
        >
          <div className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-950">
            <p>
              After approval you receive a <strong>one-time password</strong> by email or from
              your branch admin. Sign in, set your password, then use the HR portal to manage
              staff, payroll, and leave.
            </p>
            <p className="mt-2">
              <Link href="/register" className="font-medium underline">
                Registrar application
              </Link>{" "}
              is a separate form.
            </p>
          </div>
          <HrManagerApplyForm branches={branches} />
        </RegistrationLayout>
      </main>
    </div>
  );
}
