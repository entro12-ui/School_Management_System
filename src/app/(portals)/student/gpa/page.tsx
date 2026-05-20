import { PortalShell } from "@/components/layout/portal-shell";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import {
  computeGpaFromGrades,
  getStudentByUserId,
  getStudentGpaRecords,
  getStudentGrades,
  showGpaPortal,
} from "@/lib/services/student";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentGpaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await getStudentByUserId(session.user.id);
  if (!student) redirect("/login");

  const gpaRecords = await getStudentGpaRecords(student.id);
  const computedGpa = await computeGpaFromGrades(student.id);
  const recentGrades = await getStudentGrades(student.id, student.classId);
  const canShowGpa = showGpaPortal(student.gradeBand, student.gradeLevel);

  return (
    <PortalShell
      title="GPA tracker"
      subtitle={student.class?.name ?? student.branch.name}
      nav={STUDENT_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">GPA tracker</h1>
        <p className="text-slate-500">Your academic progress and semester GPA.</p>
      </div>

      {!canShowGpa ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          <p>
            GPA tracking is available from Grade 9 upward. You are in{" "}
            {student.gradeLevel === 0 ? "KG" : `Grade ${student.gradeLevel}`}.
          </p>
          <Link href="/student" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6">
              <p className="text-sm font-medium text-indigo-800">Estimated GPA (4.0 scale)</p>
              <p className="mt-2 text-4xl font-bold text-indigo-900">
                {computedGpa != null ? computedGpa.toFixed(2) : "—"}
              </p>
              <p className="mt-1 text-xs text-indigo-700">From recorded assessment scores</p>
            </div>
            {gpaRecords[0] && (
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-medium text-slate-500">Latest official record</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">
                  {gpaRecords[0].gpa.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {gpaRecords[0].term.replace("_", " ")} · {gpaRecords[0].yearLabel}
                  {gpaRecords[0].cumulative != null &&
                    ` · Cumulative ${gpaRecords[0].cumulative.toFixed(2)}`}
                </p>
              </div>
            )}
          </div>

          {gpaRecords.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 font-semibold text-slate-900">Semester records</h2>
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
                    {gpaRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">{r.yearLabel}</td>
                        <td className="px-4 py-3">{r.term.replace("_", " ")}</td>
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

          <section>
            <h2 className="mb-3 font-semibold text-slate-900">Recent scores</h2>
            {recentGrades.length === 0 ? (
              <p className="text-sm text-slate-500">No grades recorded yet.</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Assessment</th>
                      <th className="px-4 py-3 font-medium">Subject</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                      <th className="px-4 py-3 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentGrades.slice(0, 15).map((g) => {
                      const pct = Math.round(
                        (g.score / g.assessment.maxScore) * 100
                      );
                      return (
                        <tr key={g.id}>
                          <td className="px-4 py-3">{g.assessment.title}</td>
                          <td className="px-4 py-3">{g.assessment.subject.name}</td>
                          <td className="px-4 py-3 font-medium">
                            {g.score} / {g.assessment.maxScore}
                          </td>
                          <td className="px-4 py-3">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </PortalShell>
  );
}
