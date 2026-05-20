import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { auth } from "@/lib/auth";
import { formatGradeLevel } from "@/lib/grade-utils";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import {
  getStudentsInClass,
  getStudentsInGradeLevel,
  getTeacherAccessibleGradeLevels,
  getTeacherByUserId,
  getTeacherClasses,
  teacherCanAccessClass,
  teacherCanAccessGradeLevel,
} from "@/lib/services/teacher";
import { redirect } from "next/navigation";
import { TeacherStudentsTable } from "@/components/teacher/teacher-students-table";
import { Field, Select } from "@/components/ui/input";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ gradeLevel?: string; classId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) redirect("/login");

  const params = await searchParams;
  const classData = await getTeacherClasses(session.user.id);

  const requestedClassId = params.classId;
  if (requestedClassId) {
    const allowed = await teacherCanAccessClass(session.user.id, requestedClassId);
    if (!allowed) redirect("/teacher/students");

    const klass = classData?.classes.find((c) => c.id === requestedClassId);
    const students = await getStudentsInClass(teacher.branchId, requestedClassId);

    return (
      <PortalShell
        title="Class roster"
        subtitle={teacher.branch.name}
        nav={TEACHER_NAV}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {klass?.name ?? "Class"} roster
            </h1>
            <p className="text-slate-500">
              {formatGradeLevel(klass?.gradeLevel ?? 0)} · {klass?.academicYear ?? ""} ·{" "}
              {students.length} active student{students.length === 1 ? "" : "s"}
            </p>
          </div>
          <Link
            href="/teacher/classes"
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            My classes →
          </Link>
        </div>

        {students.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No students enrolled in this section yet.
          </div>
        ) : (
          <TeacherStudentsTable
            students={students.map((s) => ({
              id: s.id,
              studentId: s.studentId,
              firstName: s.firstName,
              lastName: s.lastName,
              className: s.class?.name ?? klass?.name ?? "—",
              gender: s.gender?.toLowerCase() ?? "—",
              email: s.user?.email ?? "",
            }))}
          />
        )}
      </PortalShell>
    );
  }

  const gradeLevels = await getTeacherAccessibleGradeLevels(session.user.id);
  if (gradeLevels.length === 0) {
    return (
      <PortalShell
        title="Students by grade"
        subtitle={teacher.branch.name}
        nav={TEACHER_NAV}
      >
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          No grades linked to your classes or subjects yet. Contact your branch admin.
        </div>
      </PortalShell>
    );
  }

  const requested = params.gradeLevel ? Number(params.gradeLevel) : gradeLevels[0];
  const gradeLevel = gradeLevels.includes(requested) ? requested : gradeLevels[0];

  const allowed = await teacherCanAccessGradeLevel(session.user.id, gradeLevel);
  if (!allowed) redirect("/teacher/students");

  const students = await getStudentsInGradeLevel(teacher.branchId, gradeLevel);

  return (
    <PortalShell
      title="Students by grade"
      subtitle={teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students by grade</h1>
          <p className="text-slate-500">
            All active students in {formatGradeLevel(gradeLevel)} at your branch.
          </p>
        </div>
        <Link
          href="/teacher/classes"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          My classes →
        </Link>
      </div>

      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <Field label="Grade">
          <Select name="gradeLevel" defaultValue={String(gradeLevel)}>
            {gradeLevels.map((level) => (
              <option key={level} value={level}>
                {formatGradeLevel(level)}
              </option>
            ))}
          </Select>
        </Field>
        <button
          type="submit"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          Show students
        </button>
      </form>

      <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
        <Users className="h-4 w-4" />
        <span>
          {students.length} student{students.length === 1 ? "" : "s"} in{" "}
          {formatGradeLevel(gradeLevel)}
        </span>
      </div>

      {students.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No students enrolled in this grade yet.
        </div>
      ) : (
        <TeacherStudentsTable
          students={students.map((s) => ({
            id: s.id,
            studentId: s.studentId,
            firstName: s.firstName,
            lastName: s.lastName,
            className: s.class?.name ?? "Unassigned",
            gender: s.gender?.toLowerCase() ?? "—",
            email: s.user?.email ?? "",
          }))}
        />
      )}
    </PortalShell>
  );
}
