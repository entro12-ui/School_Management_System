import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { EnrollmentDataTable } from "@/components/registrar/enrollment-data-table";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import { getEnrollmentRecords } from "@/lib/services/registrar-records";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegistrarRecordsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const manageRoles: UserRole[] = [
    UserRole.REGISTRAR,
    UserRole.BRANCH_ADMIN,
    UserRole.SUPER_ADMIN,
  ];
  if (!manageRoles.includes(session.user.role)) redirect("/login");

  const branchId =
    session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.branchId;

  const records = await getEnrollmentRecords({
    branchId: branchId ?? undefined,
    includeInactive: true,
  });

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Enrollment records"}
      subtitle={session.user.branchName ?? "All branches"}
      nav={navForUser(session.user.role, "registrar")}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enrollment sheet</h1>
          <p className="text-slate-500">
            All registered users with email, one-time password, and details. Students
            include a <strong>Grades</strong> link to full assessment data — or use{" "}
            <Link href="/registrar/students" className="text-indigo-600 hover:underline">
              Student records
            </Link>
            . Pending applications are under{" "}
            <Link href="/branch/registrations" className="text-indigo-600 hover:underline">
              Staff applications
            </Link>
            .
          </p>
        </div>
        <Link
          href="/registrar/enroll"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Enroll user
        </Link>
      </div>

      <EnrollmentDataTable
        records={records}
        showBranch={session.user.role === UserRole.SUPER_ADMIN}
      />
    </PortalShell>
  );
}
