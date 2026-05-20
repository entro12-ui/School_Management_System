import Link from "next/link";
import { BranchStaffTable } from "@/components/branch/branch-staff-table";
import { PortalShell } from "@/components/layout/portal-shell";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import { getBranchStaff } from "@/lib/services/branch-admin";

export const dynamic = "force-dynamic";

export default async function BranchStaffPage() {
  const { branchId, branchName } = await requireBranchAdmin();
  const staff = await getBranchStaff(branchId);

  const rows = staff.map((u) => ({
    id: u.id,
    employeeId: u.staffProfile?.employeeId ?? "—",
    name: `${u.firstName} ${u.lastName}`,
    email: u.email,
    phone: u.phone ?? "",
    role: u.role,
    department: u.staffProfile?.department ?? "",
  }));

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="text-slate-500">
            Teachers, registrar, finance, and library at your branch
          </p>
        </div>
        <Link
          href="/registrar/enroll"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Enroll staff
        </Link>
      </div>

      {staff.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No staff accounts yet.
        </p>
      ) : (
        <BranchStaffTable staff={rows} />
      )}
    </PortalShell>
  );
}
