import { PortalShell } from "@/components/layout/portal-shell";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import { getStudentByUserId, getStudentExams } from "@/lib/services/student";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentExamsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await getStudentByUserId(session.user.id);
  if (!student) redirect("/login");

  const exams = await getStudentExams(student.id, student.classId);

  return (
    <PortalShell
      title="Exam schedule"
      subtitle={student.class?.name ?? student.branch.name}
      nav={STUDENT_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Exam schedule</h1>
        <p className="text-slate-500">
          Midterms, finals, and national exam prep — Grade{" "}
          {student.gradeLevel === 0 ? "KG" : student.gradeLevel}
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500">
          No exams scheduled yet. Check back later or ask your class teacher.
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const grade = exam.grades[0];
            const isPast = new Date(exam.date) < new Date();
            return (
              <article
                key={exam.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="font-semibold text-slate-900">{exam.title}</h2>
                  <p className="text-sm text-slate-500">
                    {exam.subject.name} · {exam.type.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Date(exam.date).toLocaleDateString("en-ET", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  {grade ? (
                    <p className="text-lg font-bold text-indigo-600">
                      {grade.score} / {exam.maxScore}
                    </p>
                  ) : (
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        isPast ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {isPast ? "No score yet" : "Upcoming"}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PortalShell>
  );
}
