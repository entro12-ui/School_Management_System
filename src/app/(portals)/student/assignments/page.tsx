import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import {
  getStudentAssignments,
  getStudentByUserId,
} from "@/lib/services/student";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await getStudentByUserId(session.user.id);
  if (!student) redirect("/login");

  const assignments = await getStudentAssignments(student.id, student.classId);

  return (
    <PortalShell
      title="Student Portal"
      subtitle={student.class?.name ?? student.branch.name}
      nav={STUDENT_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
        <p className="text-slate-500">
          Quizzes, continuous assessment, and class tasks for{" "}
          {student.class?.name ?? "your class"}.
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No assignments posted yet for your class.</p>
          <Link href="/student" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Due / date</th>
                <th className="px-4 py-3 font-medium">Your score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => {
                const grade = a.grades[0];
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.title}</td>
                    <td className="px-4 py-3">{a.subject.name}</td>
                    <td className="px-4 py-3 capitalize">
                      {a.type.replace(/_/g, " ").toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(a.date).toLocaleDateString("en-ET")}
                    </td>
                    <td className="px-4 py-3">
                      {grade ? (
                        <span className="font-medium text-emerald-700">
                          {grade.score} / {a.maxScore}
                        </span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PortalShell>
  );
}
