import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { RegistrarStudentGradesTable } from "@/components/registrar/registrar-student-grades-table";
import { StudentIntelligenceHubSection } from "@/components/students/student-intelligence-hub-section";
import { auth } from "@/lib/auth";
import { getSchoolDataScope } from "@/lib/auth/school-data-scope";
import { navForUser } from "@/lib/nav/portal-nav";
import { getRegistrarStudentAcademicRecord } from "@/lib/services/registrar-students";
import { UserRole } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import { FileText } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ET", { dateStyle: "medium" });
}

export default async function RegistrarStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const manageRoles: UserRole[] = [
    UserRole.REGISTRAR,
    UserRole.BRANCH_ADMIN,
    UserRole.SUPER_ADMIN,
  ];
  if (!manageRoles.includes(session.user.role)) redirect("/login");

  const { studentId } = await params;
  const scope = getSchoolDataScope(session.user);
  const record = await getRegistrarStudentAcademicRecord(studentId, { scope });
  if (!record) notFound();

  const { student } = record;

  return (
    <PortalShell
      title="Student record"
      subtitle={`${student.firstName} ${student.lastName} · ${student.studentId}`}
      nav={navForUser(session.user.role, "registrar")}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/registrar/students"
            className="text-sm text-indigo-600 hover:underline"
          >
            ← All student records
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {student.firstName} {student.lastName}
          </h1>
          <p className="text-slate-500">
            {student.gradeLabel}
            {student.stream ? ` · ${student.stream}` : ""} · {student.className ?? "No class"} ·{" "}
            {student.branchName}
            {!student.isActive && (
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                Inactive
              </span>
            )}
          </p>
        </div>
        <Link
          href={`/registrar/students/${student.id}/transcript`}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <FileText className="h-4 w-4" />
          Official transcript
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Graded</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">
            {record.stats.gradedAssessments}
          </p>
          <p className="text-xs text-slate-500">of {record.stats.classAssessments} class assessments</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase text-slate-500">Subjects</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{record.stats.subjects}</p>
        </div>
        {record.showGpa && record.computedGpa != null && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-medium uppercase text-indigo-700">Estimated GPA</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">
              {record.computedGpa.toFixed(2)}
            </p>
          </div>
        )}
        {record.attendance.ratePercent != null && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">Attendance</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {record.attendance.ratePercent}%
            </p>
          </div>
        )}
      </div>

      <StudentIntelligenceHubSection
        studentId={student.id}
        studentName={`${student.firstName} ${student.lastName}`}
        userRole={session.user.role}
        branchId={student.branchId}
      />

      <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Student information</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-slate-500">Student ID</dt>
            <dd className="font-medium">{student.studentId}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd>{student.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Phone</dt>
            <dd>{student.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Date of birth</dt>
            <dd>{formatDate(student.dateOfBirth)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Gender</dt>
            <dd>{student.gender ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Enrolled</dt>
            <dd>{formatDate(student.enrollmentDate)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Academic year</dt>
            <dd>{student.academicYear ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Guardian</dt>
            <dd>{student.guardianName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Guardian contact</dt>
            <dd>
              {student.guardianPhone ?? student.guardianEmail ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {record.gpaRecords.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">GPA records</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Term</th>
                  <th className="px-4 py-3 font-medium">GPA</th>
                  <th className="px-4 py-3 font-medium">Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {record.gpaRecords.map((r, i) => (
                  <tr key={`${r.yearLabel}-${r.term}-${i}`}>
                    <td className="px-4 py-3">{r.yearLabel}</td>
                    <td className="px-4 py-3">{r.term}</td>
                    <td className="px-4 py-3 font-medium">{r.gpa.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {r.cumulative != null ? r.cumulative.toFixed(2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {record.subjectSummaries.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Subject averages</h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Graded assessments</th>
                  <th className="px-4 py-3 font-medium">Average %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {record.subjectSummaries.map((s) => (
                  <tr key={s.subject}>
                    <td className="px-4 py-3 font-medium">{s.subject}</td>
                    <td className="px-4 py-3">{s.count}</td>
                    <td className="px-4 py-3">
                      {s.averagePercent != null ? `${s.averagePercent}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          All assessments & grades
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Every assessment in the student&apos;s class, including items not yet graded.
        </p>
        <RegistrarStudentGradesTable grades={record.grades} />
      </section>
    </PortalShell>
  );
}
