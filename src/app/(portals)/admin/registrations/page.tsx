import { PortalShell } from "@/components/layout/portal-shell";
import { RegistrationQueue } from "@/components/branch/registration-queue";
import { auth } from "@/lib/auth";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { getAllPendingRegistrations } from "@/lib/services/registrations";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const requests = await getAllPendingRegistrations();

  return (
    <PortalShell title="Super Admin" subtitle="Staff applications" nav={ADMIN_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Staff applications</h1>
        <p className="text-slate-500">
          Review and approve <strong>Registrar</strong> and <strong>HR Manager</strong>{" "}
          applications from all branches.
        </p>
        <Link
          href="/branch/registrations"
          className="mt-2 inline-block text-sm text-slate-500 hover:text-indigo-600"
        >
          Same queue at branch URL →
        </Link>
        <div className="mt-4">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
            {requests.length} pending across all branches
          </span>
        </div>
      </div>

      <RegistrationQueue requests={requests} showBranch />
    </PortalShell>
  );
}
