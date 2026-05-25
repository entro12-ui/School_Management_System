import Link from "next/link";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentIdCardGenerator } from "@/components/registrar/student-id-card-generator";
import { auth } from "@/lib/auth";
import { navForUser } from "@/lib/nav/portal-nav";
import {
  getGeneratedStudentIdCards,
  getRegistrarStudentIdCards,
} from "@/lib/services/registrar-students";

export const dynamic = "force-dynamic";

export default async function RegistrarIdCardsPage() {
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

  const [students, generatedCards] = await Promise.all([
    getRegistrarStudentIdCards({
      branchId,
      includeInactive: true,
    }),
    getGeneratedStudentIdCards({ branchId }),
  ]);

  return (
    <PortalShell
      title={session.user.role === UserRole.BRANCH_ADMIN ? "Branch Admin" : "Registrar"}
      subtitle={session.user.branchName ?? "All branches"}
      nav={navForUser(session.user.role, "registrar")}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Generate student ID cards</h1>
          <p className="text-slate-500">
            Print identity cards with student photo, full name, student ID, grade, class, school,
            academic year, and guardian emergency contact.
          </p>
        </div>
        <Link
          href="/registrar/enroll"
          className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Enroll student
        </Link>
      </div>

      <StudentIdCardGenerator
        students={students}
        generatedCards={generatedCards}
        showBranch={session.user.role === UserRole.SUPER_ADMIN}
      />
    </PortalShell>
  );
}
