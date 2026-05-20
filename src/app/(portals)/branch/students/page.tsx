import Link from "next/link";
import { BranchStudentsTable } from "@/components/branch/branch-students-table";
import { PortalShell } from "@/components/layout/portal-shell";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import { getBranchStudents } from "@/lib/services/branch-admin";

export const dynamic = "force-dynamic";

export default async function BranchStudentsPage() {
  const { branchId, branchName } = await requireBranchAdmin();
  const students = await getBranchStudents(branchId);

  const rows = students.map((s) => {
    const outstanding = s.payments.reduce(
      (sum, p) => sum + Number(p.amount) - Number(p.paidAmount),
      0
    );
    const guardian = s.guardian?.user;
    return {
      id: s.id,
      studentId: s.studentId,
      firstName: s.firstName,
      lastName: s.lastName,
      gradeLevel: s.gradeLevel,
      className: s.class?.name ?? "—",
      guardianName: guardian
        ? `${guardian.firstName} ${guardian.lastName}`
        : "—",
      outstanding,
    };
  });

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500">
            {students.length} active student{students.length === 1 ? "" : "s"} at your branch
          </p>
        </div>
        <Link
          href="/registrar/enroll"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Enroll student
        </Link>
      </div>

      {students.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No students yet.
        </p>
      ) : (
        <BranchStudentsTable students={rows} />
      )}
    </PortalShell>
  );
}
