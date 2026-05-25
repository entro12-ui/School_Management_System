"use client";

import { FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  RegistrarSemesterTranscriptData,
  RegistrarTranscriptSemester,
} from "@/lib/services/registrar-transcript";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ET", { dateStyle: "long" });
}

function formatNumber(value: number | null) {
  if (value === null) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function rankLabel(semester: RegistrarTranscriptSemester) {
  if (!semester.rank || semester.classSize === 0) return "—";
  return `${semester.rank} / ${semester.classSize}`;
}

export function RegistrarSemesterTranscript({
  data,
}: {
  data: RegistrarSemesterTranscriptData;
}) {
  const { student } = data;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          .official-transcript, .official-transcript * { visibility: visible !important; }
          .official-transcript {
            position: absolute;
            inset: 0 auto auto 0;
            width: 100% !important;
            border: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            background: white !important;
          }
          .transcript-no-print { display: none !important; }
          .semester-block { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="transcript-no-print flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-indigo-600 p-3 text-white shadow-lg shadow-indigo-200">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-700">
              Registrar transcript
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">
              Professional semester transcript
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Official end-of-semester result sheet with marks out of 100, totals, averages,
              class rank, registrar signature, and school stamp section.
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => window.print()} className="w-fit">
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      <article className="official-transcript overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 text-slate-950 shadow-xl shadow-slate-200/70">
        <header className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-6 text-white">
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/30 blur-2xl" />
          <div className="absolute -bottom-20 left-20 h-44 w-44 rounded-full bg-sky-400/20 blur-2xl" />
          <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">
                Official academic record
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">{data.schoolName}</h1>
              <p className="mt-2 text-sm text-slate-300">
                {student.branchName} · {student.branchCity}
                {student.branchAddress ? ` · ${student.branchAddress}` : ""}
                {student.branchPhone ? ` · Tel: ${student.branchPhone}` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-right backdrop-blur">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Transcript No.</p>
              <p className="mt-1 font-mono text-sm font-bold">{data.documentNumber}</p>
              <p className="mt-3 text-xs text-slate-300">Issued {formatDate(data.issuedAt)}</p>
              <p className="text-xs text-slate-300">{data.country}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-sm md:grid-cols-2 lg:grid-cols-4">
          <Info label="Student full name" value={student.fullName} strong />
          <Info label="Student ID" value={student.studentId} strong />
          <Info label="Grade / class" value={`${student.gradeLabel} · ${student.className ?? "No class"}`} />
          <Info label="Academic year" value={student.academicYear ?? "—"} />
          <Info label="Date of birth" value={formatDate(student.dateOfBirth)} />
          <Info label="Gender" value={student.gender ?? "—"} />
          <Info label="Stream" value={student.stream?.replace(/_/g, " ") ?? "—"} />
          <Info label="Calendar" value={data.calendar} />
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Yearly average" value={`${formatNumber(data.yearlyAverage)}%`} />
          <SummaryCard
            label="Yearly total"
            value={
              data.yearlyTotal === null
                ? "—"
                : `${formatNumber(data.yearlyTotal)} / ${formatNumber(data.yearlyMaxTotal)}`
            }
          />
          <SummaryCard label="Semesters reported" value={String(data.semesters.length)} />
        </section>

        <div className="mt-6 space-y-6">
          {data.semesters.map((semester) => (
            <section key={semester.term} className="semester-block rounded-2xl border border-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-100 to-indigo-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
                    End of semester result
                  </p>
                  <h2 className="text-xl font-bold text-slate-950">{semester.termLabel}</h2>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[360px]">
                  <MiniStat label="Total" value={semester.total === null ? "—" : `${formatNumber(semester.total)} / ${formatNumber(semester.maxTotal)}`} />
                  <MiniStat label="Average" value={`${formatNumber(semester.average)}%`} />
                  <MiniStat label="Class rank" value={rankLabel(semester)} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-left text-xs uppercase tracking-wide text-white">
                      <th className="px-4 py-3">No.</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3 text-right">Mark / 100</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assessment evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {semester.subjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                          No semester assessment records yet.
                        </td>
                      </tr>
                    ) : (
                      semester.subjects.map((subject, index) => (
                        <tr key={subject.subjectId} className="align-top">
                          <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-950">{subject.subject}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">
                            {subject.subjectCode}
                          </td>
                          <td className="px-4 py-3 text-right text-lg font-black text-indigo-700">
                            {formatNumber(subject.mark)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                subject.status === "COMPLETE"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              }`}
                            >
                              {subject.status === "COMPLETE" ? "Complete" : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
                            {subject.assessments
                              .map((a) =>
                                `${a.title}: ${a.score ?? "—"}/${formatNumber(a.maxScore)}`
                              )
                              .join(" · ")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 grid gap-6 border-t border-slate-200 pt-6 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Prepared by
            </p>
            <div className="mt-8 border-t border-slate-400 pt-2">
              <p className="font-semibold text-slate-950">{data.issuedBy.name}</p>
              <p className="text-xs text-slate-500">{data.issuedBy.role}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Registrar signature
            </p>
            <div className="mt-8 border-t border-slate-400 pt-2 text-xs text-slate-500">
              Signature and date
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-double border-indigo-700 text-center text-[10px] font-black uppercase tracking-[0.18em] text-indigo-800">
              Official
              <br />
              School
              <br />
              Stamp
            </div>
          </div>
        </section>

        <footer className="mt-6 rounded-2xl bg-slate-950 px-5 py-4 text-xs leading-relaxed text-slate-300">
          This transcript is issued by the Registrar Office and is valid only with registrar
          signature and official school stamp. Alteration, erasure, or unauthorized reproduction
          invalidates this document.
        </footer>
      </article>
    </div>
  );
}

function Info({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={strong ? "mt-1 font-bold text-slate-950" : "mt-1 text-slate-700"}>
        {value}
      </p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
      <p className="font-semibold text-slate-950">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
