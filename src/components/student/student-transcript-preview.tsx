import type { StudentTranscriptData } from "@/lib/services/student-transcript";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ET", { dateStyle: "medium" });
}

export function StudentTranscriptPreview({ data }: { data: StudentTranscriptData }) {
  const { student } = data;

  return (
    <article
      id="student-transcript"
      className="rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm print:border-0 print:shadow-none print:p-0"
    >
      <header className="border-b border-slate-200 pb-4 text-center print:border-slate-400">
        <h2 className="text-xl font-bold">{data.schoolName}</h2>
        <p className="text-sm text-slate-600">Official academic transcript</p>
        <p className="mt-1 text-xs text-slate-500">
          Issued {formatDate(data.issuedAt)} · {data.defaultCountry}
        </p>
      </header>

      <section className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <span className="text-slate-500">Student</span>
          <p className="font-medium">{student.fullName}</p>
        </div>
        <div>
          <span className="text-slate-500">Student ID</span>
          <p className="font-medium">{student.studentId}</p>
        </div>
        <div>
          <span className="text-slate-500">Branch</span>
          <p>{student.branchName}</p>
        </div>
        <div>
          <span className="text-slate-500">Class</span>
          <p>{student.className ?? "—"}</p>
        </div>
        <div>
          <span className="text-slate-500">Grade</span>
          <p>
            {student.gradeLabel}
            {student.stream ? ` · ${student.stream}` : ""}
          </p>
        </div>
        <div>
          <span className="text-slate-500">Academic year</span>
          <p>{student.academicYear ?? "—"}</p>
        </div>
      </section>

      {data.showGpa && (data.computedGpa != null || data.gpaRecords.length > 0) && (
        <section className="mt-6">
          <h3 className="mb-2 font-semibold">GPA summary</h3>
          {data.computedGpa != null && (
            <p className="text-sm">
              Estimated GPA (4.0 scale):{" "}
              <strong className="text-indigo-700">{data.computedGpa.toFixed(2)}</strong>
            </p>
          )}
          {data.gpaRecords.length > 0 && (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Year</th>
                    <th className="px-3 py-2 font-medium">Term</th>
                    <th className="px-3 py-2 font-medium">GPA</th>
                    <th className="px-3 py-2 font-medium">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.gpaRecords.map((r, i) => (
                    <tr key={`${r.yearLabel}-${r.term}-${i}`}>
                      <td className="px-3 py-2">{r.yearLabel}</td>
                      <td className="px-3 py-2">{r.term}</td>
                      <td className="px-3 py-2 font-medium">{r.gpa.toFixed(2)}</td>
                      <td className="px-3 py-2">
                        {r.cumulative != null ? r.cumulative.toFixed(2) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <section className="mt-6">
        <h3 className="mb-2 font-semibold">Subject summary</h3>
        {data.subjectSummaries.length === 0 ? (
          <p className="text-sm text-slate-500">No graded assessments on record.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Subject</th>
                  <th className="px-3 py-2 font-medium">Assessments</th>
                  <th className="px-3 py-2 font-medium">Average %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.subjectSummaries.map((s) => (
                  <tr key={s.subject}>
                    <td className="px-3 py-2 font-medium">{s.subject}</td>
                    <td className="px-3 py-2">{s.assessmentCount}</td>
                    <td className="px-3 py-2">{s.averagePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6">
        <h3 className="mb-2 font-semibold">Detailed grades</h3>
        {data.grades.length === 0 ? (
          <p className="text-sm text-slate-500">No grades recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Subject</th>
                  <th className="px-3 py-2 font-medium">Assessment</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Term</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                  <th className="px-3 py-2 font-medium">%</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.grades.map((g) => (
                  <tr key={g.id}>
                    <td className="px-3 py-2">{g.subject}</td>
                    <td className="px-3 py-2">{g.title}</td>
                    <td className="px-3 py-2">{g.typeLabel}</td>
                    <td className="px-3 py-2">{g.termLabel}</td>
                    <td className="px-3 py-2">
                      {g.score} / {g.maxScore}
                    </td>
                    <td className="px-3 py-2">{g.percent}%</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDate(g.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 text-sm text-slate-600">
        <h3 className="mb-1 font-semibold text-slate-900">Attendance</h3>
        {data.attendance.ratePercent != null ? (
          <p>
            Rate: <strong>{data.attendance.ratePercent}%</strong> — Present {data.attendance.present},
            Absent {data.attendance.absent}, Late {data.attendance.late}, Excused{" "}
            {data.attendance.excused}
          </p>
        ) : (
          <p>No attendance records yet.</p>
        )}
      </section>
    </article>
  );
}
