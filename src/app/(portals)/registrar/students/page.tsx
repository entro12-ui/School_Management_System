import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { RegistrarStudentsTable } from "@/components/registrar/registrar-students-table";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import { getRegistrarStudentList } from "@/lib/services/registrar-students";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegistrarStudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const manageRoles: UserRole[] = [
    UserRole.REGISTRAR,
    UserRole.BRANCH_ADMIN,
    UserRole.SUPER_ADMIN,
  ];
  if (!manageRoles.includes(session.user.role)) redirect("/login");

  const branchId =
    session.user.role === UserRole.SUPER_ADMIN ? undefined : session.user.branchId ?? undefined;

  const students = await getRegistrarStudentList({
    branchId,
    includeInactive: true,
  });

  return (
    <PortalShell
      title="Student records"
      subtitle={session.user.branchName ?? "All branches"}
      nav={navForUser(session.user.role, "registrar")}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student academic records</h1>
          <p className="text-slate-500">
            All enrolled students with stored grades and class assessments. Open a student
            to view every assessment, scores, GPA, and attendance.
          </p>
        </div>
        <Link
          href="/registrar/enroll"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Enroll student
        </Link>
      </div>

      <RegistrarStudentsTable
        students={students}
        showBranch={session.user.role === UserRole.SUPER_ADMIN}
      />
    </PortalShell>
  );
}
