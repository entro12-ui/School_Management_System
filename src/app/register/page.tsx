import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { RegistrationLayout } from "@/components/registration/registration-layout";
import { RegistrarApplyForm } from "@/components/registration/registrar-apply-form";
import { getPublicBranches } from "@/lib/services/registrations";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
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
          title="Registrar office application"
          description="Students, teachers, and other roles are enrolled by the registrar office — not self-registered online."
        >
          <div className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <p>
              <strong>Already have an account?</strong> Sign in with the one-time password from
              your branch, then set your permanent password.
            </p>
            <p>
              <strong>Registrar office</strong> — use the form below. Approved by branch or super
              admin.
            </p>
            <p>
              <strong>HR Manager</strong> —{" "}
              <Link href="/register/hr-manager" className="font-medium text-indigo-600 hover:underline">
                apply here
              </Link>{" "}
              (online registration, then approval).
            </p>
          </div>
          <RegistrarApplyForm branches={branches} />
        </RegistrationLayout>
      </main>
    </div>
  );
}
