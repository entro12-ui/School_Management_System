import type { StudentTranscriptData } from "@/lib/services/student-transcript";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-ET", { dateStyle: "long" });
}

export function renderTranscriptHtml(data: StudentTranscriptData): string {
  const { student } = data;
  const issued = formatDate(data.issuedAt);

  const gpaBlock =
    data.showGpa && (data.computedGpa != null || data.gpaRecords.length > 0)
      ? `<section class="section">
  <h2>GPA summary</h2>
  ${
    data.computedGpa != null
      ? `<p><strong>Estimated GPA (4.0 scale):</strong> ${data.computedGpa.toFixed(2)}</p>`
      : ""
  }
  ${
    data.gpaRecords.length > 0
      ? `<table>
    <thead><tr><th>Year</th><th>Term</th><th>GPA</th><th>Cumulative</th></tr></thead>
    <tbody>${data.gpaRecords
      .map(
        (r) =>
          `<tr><td>${escapeHtml(r.yearLabel)}</td><td>${escapeHtml(r.term)}</td><td>${r.gpa.toFixed(2)}</td><td>${r.cumulative != null ? r.cumulative.toFixed(2) : "—"}</td></tr>`
      )
      .join("")}</tbody>
  </table>`
      : ""
  }
</section>`
      : "";

  const subjectRows = data.subjectSummaries
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.subject)}</td><td>${s.assessmentCount}</td><td>${s.averagePercent}%</td></tr>`
    )
    .join("");

  const gradeRows = data.grades
    .map(
      (g) =>
        `<tr>
      <td>${escapeHtml(g.subject)}</td>
      <td>${escapeHtml(g.title)}</td>
      <td>${escapeHtml(g.typeLabel)}</td>
      <td>${escapeHtml(g.termLabel)}</td>
      <td>${g.score} / ${g.maxScore}</td>
      <td>${g.percent}%</td>
      <td>${formatDate(g.date)}</td>
    </tr>`
    )
    .join("");

  const attendance =
    data.attendance.ratePercent != null
      ? `<p><strong>Attendance rate:</strong> ${data.attendance.ratePercent}% (Present ${data.attendance.present}, Absent ${data.attendance.absent}, Late ${data.attendance.late}, Excused ${data.attendance.excused})</p>`
      : "<p><strong>Attendance:</strong> No records yet.</p>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Academic transcript — ${escapeHtml(student.fullName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, "Times New Roman", serif; color: #111; margin: 2rem; line-height: 1.45; }
    h1 { font-size: 1.5rem; margin: 0 0 0.25rem; text-align: center; }
    .meta { text-align: center; color: #444; font-size: 0.9rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; margin: 1.5rem 0 0.75rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-bottom: 1rem; }
    th, td { border: 1px solid #ddd; padding: 0.4rem 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; font-size: 0.9rem; }
    .footer { margin-top: 2rem; font-size: 0.8rem; color: #666; border-top: 1px solid #ddd; padding-top: 1rem; }
    @media print {
      body { margin: 0.75in; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(data.schoolName)}</h1>
  <p class="meta">Official academic transcript · ${escapeHtml(data.defaultCountry)}<br />Issued ${issued}</p>

  <section class="section">
    <h2>Student information</h2>
    <div class="grid">
      <div><strong>Name:</strong> ${escapeHtml(student.fullName)}</div>
      <div><strong>Student ID:</strong> ${escapeHtml(student.studentId)}</div>
      <div><strong>Branch:</strong> ${escapeHtml(student.branchName)}</div>
      <div><strong>Class:</strong> ${escapeHtml(student.className ?? "—")}</div>
      <div><strong>Grade:</strong> ${escapeHtml(student.gradeLabel)}${student.stream ? ` · ${escapeHtml(student.stream)}` : ""}</div>
      <div><strong>Academic year:</strong> ${escapeHtml(student.academicYear ?? "—")}</div>
      <div><strong>Date of birth:</strong> ${formatDate(student.dateOfBirth)}</div>
      <div><strong>Enrolled:</strong> ${formatDate(student.enrollmentDate)}</div>
    </div>
    <p style="margin-top:0.75rem;font-size:0.85rem;color:#555;">Calendar: ${escapeHtml(data.academicCalendar)}</p>
  </section>

  ${gpaBlock}

  <section class="section">
    <h2>Subject summary</h2>
    ${
      subjectRows
        ? `<table><thead><tr><th>Subject</th><th>Assessments</th><th>Avg %</th></tr></thead><tbody>${subjectRows}</tbody></table>`
        : "<p>No graded assessments on record.</p>"
    }
  </section>

  <section class="section">
    <h2>Detailed grades</h2>
    ${
      gradeRows
        ? `<table>
      <thead><tr><th>Subject</th><th>Assessment</th><th>Type</th><th>Term</th><th>Score</th><th>%</th><th>Date</th></tr></thead>
      <tbody>${gradeRows}</tbody>
    </table>`
        : "<p>No grades recorded yet.</p>"
    }
  </section>

  <section class="section">
    <h2>Attendance</h2>
    ${attendance}
  </section>

  <p class="footer">This document was generated from ${escapeHtml(data.schoolName)} student records. For university applications, save as PDF from your browser print dialog or use the downloaded HTML/CSV from the student portal.</p>
</body>
</html>`;
}

export function renderTranscriptCsv(data: StudentTranscriptData): string {
  const lines: string[] = [
    `School,${csvCell(data.schoolName)}`,
    `Student ID,${csvCell(data.student.studentId)}`,
    `Name,${csvCell(data.student.fullName)}`,
    `Branch,${csvCell(data.student.branchName)}`,
    `Class,${csvCell(data.student.className ?? "")}`,
    `Grade,${csvCell(data.student.gradeLabel)}`,
    `Issued,${csvCell(new Date(data.issuedAt).toISOString())}`,
    "",
    "Subject,Assessment,Type,Term,Score,Max Score,Percent,Date",
  ];

  for (const g of data.grades) {
    lines.push(
      [
        csvCell(g.subject),
        csvCell(g.title),
        csvCell(g.typeLabel),
        csvCell(g.termLabel),
        String(g.score),
        String(g.maxScore),
        String(g.percent),
        csvCell(new Date(g.date).toISOString().slice(0, 10)),
      ].join(",")
    );
  }

  if (data.gpaRecords.length > 0) {
    lines.push("", "Year,Term,GPA,Cumulative");
    for (const r of data.gpaRecords) {
      lines.push(
        [
          csvCell(r.yearLabel),
          csvCell(r.term),
          r.gpa.toFixed(2),
          r.cumulative != null ? r.cumulative.toFixed(2) : "",
        ].join(",")
      );
    }
  }

  return lines.join("\n");
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
