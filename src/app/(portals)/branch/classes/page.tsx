import { PortalShell } from "@/components/layout/portal-shell";
import { ClassHomeroomTable } from "@/components/branch/class-homeroom-table";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import {
  getBranchClasses,
  getBranchTeachersForAssignment,
} from "@/lib/services/branch-admin";
import { formatGradeLevel } from "@/lib/grade-utils";

export const dynamic = "force-dynamic";

export default async function BranchClassesPage() {
  const { branchId, branchName } = await requireBranchAdmin();

  const [classes, teachers] = await Promise.all([
    getBranchClasses(branchId),
    getBranchTeachersForAssignment(branchId),
  ]);

  const rows = classes.map((c) => {
    const primary = c.teachers[0]?.teacher;
    return {
      id: c.id,
      name: c.name,
      gradeLevel: c.gradeLevel,
      academicYear: c.academicYear.name,
      studentCount: c._count.students,
      homeroomTeacherId: primary?.id ?? null,
      homeroomTeacherName: primary?.user
        ? `${primary.user.firstName} ${primary.user.lastName}`
        : null,
    };
  });

  const teacherOptions = teachers.map((t) => {
    const homeroom = t.classAssignments[0]?.class;
    return {
      id: t.id,
      employeeId: t.employeeId,
      name: `${t.user.firstName} ${t.user.lastName}`,
      email: t.user.email,
      currentHomeroom: homeroom
        ? `${homeroom.name} (${formatGradeLevel(homeroom.gradeLevel)})`
        : null,
      usesOtp: t.user.mustChangePassword,
    };
  });

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Classes & homeroom</h1>
        <p className="text-slate-500">
          {classes.length} sections · assign one registered teacher per class (not one teacher for
          all).
        </p>
      </div>

      <ClassHomeroomTable classes={rows} teachers={teacherOptions} />
    </PortalShell>
  );
}
