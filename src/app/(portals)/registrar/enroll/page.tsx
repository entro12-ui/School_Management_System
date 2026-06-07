import { PortalShell } from "@/components/layout/portal-shell";
import { EnrollUserForm } from "@/components/registrar/enroll-user-form";
import { auth } from "@/lib/auth";
import { getEnrollableRolesFor } from "@/lib/enrollment/enrollable-roles";
import { navForUser } from "@/lib/nav/portal-nav";
import { getBranchesForUser } from "@/lib/services/registrations";
import { getAllSubjects } from "@/lib/services/teacher";
import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegistrarEnrollPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const enrollRoles: UserRole[] = [
    UserRole.REGISTRAR,
    UserRole.BRANCH_ADMIN,
    UserRole.SUPER_ADMIN,
  ];
  const canEnroll = enrollRoles.includes(session.user.role);
  if (!canEnroll) redirect("/login");

  const [branches, subjects] = await Promise.all([
    getBranchesForUser(session.user),
    getAllSubjects(),
  ]);

  const showBranchPicker = session.user.role === UserRole.SUPER_ADMIN;
  const allowedRoles = getEnrollableRolesFor(session.user.role);
  const isSuperAdmin = session.user.role === UserRole.SUPER_ADMIN;

  return (
    <PortalShell
      title={
        isSuperAdmin
          ? "Super Admin"
          : session.user.role === UserRole.BRANCH_ADMIN
            ? "Branch Admin"
            : "Enroll user"
      }
      subtitle={session.user.branchName ?? "Registrar office"}
      nav={navForUser(session.user.role, "registrar")}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Enroll user</h1>
        <p className="text-slate-500">
          Creates the account immediately with a one-time password. Super admins and branch admins
          can enroll registrars, HR Managers, branch admins, and all standard roles. Copy the OTP
          from here or the enrollment sheet.
        </p>
      </div>

      <EnrollUserForm
        branches={branches}
        subjects={subjects}
        defaultBranchId={session.user.branchId ?? undefined}
        showBranchPicker={showBranchPicker}
        allowedRoles={allowedRoles}
      />
    </PortalShell>
  );
}
