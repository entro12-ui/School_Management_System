import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { PortalShell } from "@/components/layout/portal-shell";
import { StudentIntelligenceHubSection } from "@/components/students/student-intelligence-hub-section";
import { auth } from "@/lib/auth";
import { getSchoolDataScope, studentScopeWhere } from "@/lib/auth/school-data-scope";
import { formatGradeLevel } from "@/lib/grade-utils";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import { prisma } from "@/lib/prisma";
import { getTeacherByUserId, getTeacherClasses } from "@/lib/services/teacher";

export const dynamic = "force-dynamic";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== UserRole.TEACHER && session.user.role !== UserRole.SUPER_ADMIN) {
    redirect("/login");
  }

  const { studentId } = await params;
  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) redirect("/login");

  const classData = await getTeacherClasses(session.user.id);
  const classIds = classData?.classes.map((cls) => cls.id) ?? [];

  const scope = getSchoolDataScope(session.user);
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      isActive: true,
      ...(session.user.role === UserRole.SUPER_ADMIN
        ? studentScopeWhere(scope)
        : { branchId: teacher.branchId, classId: { in: classIds } }),
    },
    include: {
      branch: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  if (!student) notFound();

  return (
    <PortalShell
      title="Student record"
      subtitle={`${student.firstName} ${student.lastName} · ${student.studentId}`}
      nav={TEACHER_NAV}
    >
      <div className="mb-6">
        <Link
          href="/teacher/students"
          className="text-sm text-indigo-600 hover:underline"
        >
          ← All students
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          {student.firstName} {student.lastName}
        </h1>
        <p className="text-slate-500">
          {formatGradeLevel(student.gradeLevel)} · {student.class?.name ?? "No class"} ·{" "}
          {student.branch.name}
        </p>
      </div>

      <StudentIntelligenceHubSection
        studentId={student.id}
        studentName={`${student.firstName} ${student.lastName}`}
        userRole={session.user.role}
        branchId={teacher.branchId}
      />
    </PortalShell>
  );
}
