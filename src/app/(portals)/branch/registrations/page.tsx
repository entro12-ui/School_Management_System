import { PortalShell } from "@/components/layout/portal-shell";
import { RegistrationQueue } from "@/components/branch/registration-queue";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import { auth } from "@/lib/auth";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import {
  getAllPendingRegistrations,
  getPendingRegistrations,
  getRegistrationCounts,
} from "@/lib/services/registrations";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BranchRegistrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";
  const isBranchAdmin = session.user.role === "BRANCH_ADMIN";

  if (!isSuperAdmin && !isBranchAdmin) redirect("/login");

  let branchId = session.user.branchId;
  let nav = BRANCH_NAV;
  let title = "Branch Admin";
  let subtitle = session.user.branchName ?? "Registrations";

  if (isBranchAdmin) {
    const scope = await requireBranchAdmin();
    branchId = scope.branchId;
    subtitle = scope.branchName;
  } else if (!branchId) {
    nav = ADMIN_NAV;
    title = "Super Admin";
    subtitle = "All branches";
  }

  const requests = branchId
    ? await getPendingRegistrations(branchId)
    : await getAllPendingRegistrations();

  const counts = branchId
    ? await getRegistrationCounts(branchId)
    : {
        pending: requests.length,
        approved: 0,
        rejected: 0,
      };

  return (
    <PortalShell title={title} subtitle={subtitle} nav={nav}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Staff applications</h1>
        <p className="text-slate-500">
          Approve online applications for <strong>Registrar</strong> and{" "}
          <strong>HR Manager</strong>. Teachers, librarians, and other roles are enrolled by
          the registrar or HR after approval.
        </p>
        <Link
          href="/registrar/enroll"
          className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Open enrollment desk →
        </Link>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">
            {counts.pending} pending
          </span>
          {branchId && (
            <>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
                {counts.approved} approved
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {counts.rejected} rejected
              </span>
            </>
          )}
        </div>
      </div>

      <RegistrationQueue requests={requests} showBranch={!branchId} />
    </PortalShell>
  );
}
