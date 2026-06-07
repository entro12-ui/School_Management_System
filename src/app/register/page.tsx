import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { RegistrationLayout } from "@/components/registration/registration-layout";
import { RegistrarApplyForm } from "@/components/registration/registrar-apply-form";
import { getPublicBranches } from "@/lib/services/registrations";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const branches = await getPublicBranches();

  return (
    <div className="min-h-screen bg-premium-canvas">
      <header className="border-b border-premium-ink/8 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-premium-accent text-white">
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
        <RegistrationLayout
          title="Registrar office application"
          description="Students, teachers, and other roles are enrolled by the registrar office — not self-registered online."
        >
          <div className="mb-6 space-y-3 rounded-xl border border-premium-ink/8 bg-white p-5 text-sm text-premium-ink/65 shadow-[var(--shadow-premium-sm)]">
            <p>
              <strong className="text-premium-ink">Already have an account?</strong> Sign in with
              the one-time password from your branch, then set your permanent password.
            </p>
            <p>
              <strong className="text-premium-ink">New school?</strong>{" "}
              <Link href="/register/school" className="font-medium text-premium-accent hover:underline">
                Register your school on EduSync SMS
              </Link>{" "}
              — pay 30 ETB per student after approval.
            </p>
            <p>
              <strong className="text-premium-ink">Registrar office</strong> — use the form below.
              Approved by branch or super admin.
            </p>
            <p>
              <strong className="text-premium-ink">HR Manager</strong> —{" "}
              <Link href="/register/hr-manager" className="font-medium text-premium-accent hover:underline">
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
