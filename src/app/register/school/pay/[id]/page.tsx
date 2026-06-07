import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { notFound } from "next/navigation";
import { SchoolSignupPayButton } from "@/components/platform/school-signup-pay-button";
import { PlatformPaymentReturnHandler } from "@/components/platform/platform-payment-return-handler";
import { platformPaymentSummary } from "@/lib/services/platform-payments";
import { getSchoolSignupById } from "@/lib/services/school-signups";

export const dynamic = "force-dynamic";

export default async function SchoolSignupPayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signup = await getSchoolSignupById(id);
  if (!signup) notFound();

  const summary = platformPaymentSummary(signup.estimatedStudents);

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
        <Link href="/register/school" className="text-sm text-slate-500 hover:text-indigo-600">
          ← School registration
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">{signup.schoolName}</h1>
        <p className="mt-2 text-slate-600">Subscription activation for EduSync SMS</p>

        <div className="mt-8 space-y-6">
          <PlatformPaymentReturnHandler />

          {signup.status === "PENDING" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
              Your application is awaiting platform review. Once approved, a payment link will be
          emailed to your contact address.
            </div>
          )}

          {signup.status === "REJECTED" && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              This application was not approved.
              {signup.rejectionReason ? ` Reason: ${signup.rejectionReason}` : ""}
            </div>
          )}

          {signup.status === "PROVISIONED" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
              Your school workspace is active.{" "}
              <Link href="/login" className="font-medium underline">
                Sign in
              </Link>{" "}
              with your super admin credentials to manage branches.
            </div>
          )}

          {signup.status === "APPROVED" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Pay to activate</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Estimated students</dt>
                  <dd className="font-medium text-slate-900">{summary.studentCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Rate</dt>
                  <dd className="font-medium text-slate-900">
                    {summary.pricePerStudent} ETB / student
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
                  <dt className="font-semibold text-slate-900">Total</dt>
                  <dd className="font-bold text-slate-900">
                    {summary.formattedAmount} ETB
                  </dd>
                </div>
              </dl>
              <div className="mt-6">
                <SchoolSignupPayButton
                  signupRequestId={signup.id}
                  amountLabel={summary.formattedAmount}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
