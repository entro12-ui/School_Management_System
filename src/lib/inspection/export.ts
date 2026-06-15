import type { InspectionFramework, InspectionScoreSummary } from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type InspectionReportMeta = {
  branchName: string;
  organizationName?: string | null;
  inspectionDate: string;
  academicYearName?: string | null;
  inspectorName: string;
  supervisorName?: string | null;
  status: string;
  frameworkTitle: string;
  issuedAt: string;
};

export function renderInspectionReportHtml(
  meta: InspectionReportMeta,
  framework: InspectionFramework,
  summary: InspectionScoreSummary,
  narrative: {
    strengths?: string | null;
    gaps?: string | null;
    recommendations?: string | null;
    inspectorComments?: string | null;
    finalOutcome?: string | null;
  }
): string {
  const domainRows = summary.domains
    .map(
      (d) =>
        `<tr>
      <td>${escapeHtml(d.titleEn)}</td>
      <td>${d.weightPercent}%</td>
      <td>${d.earnedPoints} / ${d.maxPoints}</td>
      <td>${d.percent}%</td>
    </tr>`
    )
    .join("");

  const standardRows = summary.standards
    .map((s) => {
      const pct =
        s.maxPoints > 0 ? round((s.earnedPoints / s.maxPoints) * 100) : 0;
      return `<tr>
      <td>${s.number}</td>
      <td>${escapeHtml(s.titleEn)}</td>
      <td>${s.earnedPoints} / ${s.maxPoints}</td>
      <td>${pct}%</td>
      <td>${s.scoredCount} / ${s.totalCriteria}</td>
    </tr>`;
    })
    .join("");

  const narrativeBlock = [
    narrative.strengths && `<p><strong>Strength areas:</strong> ${escapeHtml(narrative.strengths)}</p>`,
    narrative.gaps && `<p><strong>Identified gaps:</strong> ${escapeHtml(narrative.gaps)}</p>`,
    narrative.recommendations &&
      `<p><strong>Recommendations:</strong> ${escapeHtml(narrative.recommendations)}</p>`,
    narrative.inspectorComments &&
      `<p><strong>Inspector comments:</strong> ${escapeHtml(narrative.inspectorComments)}</p>`,
    narrative.finalOutcome &&
      `<p><strong>Final outcome:</strong> ${escapeHtml(narrative.finalOutcome)}</p>`,
  ]
    .filter(Boolean)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Inspection Report — ${escapeHtml(meta.branchName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Georgia, "Times New Roman", serif; color: #111; margin: 2rem; line-height: 1.45; }
    h1 { font-size: 1.4rem; margin: 0 0 0.25rem; text-align: center; }
    h2 { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
    .meta { text-align: center; color: #444; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin: 0.5rem 0 1rem; font-size: 0.9rem; }
    th, td { border: 1px solid #ccc; padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; }
    .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 1rem; margin: 1rem 0; }
    .footer { margin-top: 2rem; font-size: 0.85rem; color: #666; }
  </style>
</head>
<body>
  <h1>Internal Inspection Report</h1>
  <p class="meta">${escapeHtml(meta.frameworkTitle)}</p>
  <p class="meta"><strong>${escapeHtml(meta.branchName)}</strong>${meta.organizationName ? ` — ${escapeHtml(meta.organizationName)}` : ""}</p>

  <div class="summary-box">
    <p><strong>Inspection date:</strong> ${escapeHtml(meta.inspectionDate)}</p>
    <p><strong>Academic year:</strong> ${escapeHtml(meta.academicYearName ?? "—")}</p>
    <p><strong>Lead inspector:</strong> ${escapeHtml(meta.inspectorName)}</p>
    ${meta.supervisorName ? `<p><strong>Supervisor:</strong> ${escapeHtml(meta.supervisorName)}</p>` : ""}
    <p><strong>Status:</strong> ${escapeHtml(meta.status)}</p>
    <p><strong>Overall score:</strong> ${summary.totalEarned} / ${summary.totalMax} (${summary.overallPercent}%)</p>
    <p><strong>Criteria evaluated:</strong> ${summary.scoredCriteria} / ${summary.totalCriteria}</p>
  </div>

  <h2>Performance by domain</h2>
  <table>
    <thead><tr><th>Domain</th><th>Weight</th><th>Score</th><th>%</th></tr></thead>
    <tbody>${domainRows}</tbody>
  </table>

  <h2>Performance by standard</h2>
  <table>
    <thead><tr><th>#</th><th>Standard</th><th>Score</th><th>%</th><th>Criteria</th></tr></thead>
    <tbody>${standardRows}</tbody>
  </table>

  ${narrativeBlock ? `<h2>Analysis and recommendations</h2>${narrativeBlock}` : ""}

  <p class="footer">Generated ${escapeHtml(meta.issuedAt)} — ${escapeHtml(framework.version.publisherEn ?? "Ministry of Education")}</p>
</body>
</html>`;
}

export function renderInspectionReportCsv(
  meta: InspectionReportMeta,
  summary: InspectionScoreSummary
): string {
  const lines: string[] = [
    "Internal Inspection Report",
    `Branch,${csvCell(meta.branchName)}`,
    `Inspection Date,${csvCell(meta.inspectionDate)}`,
    `Inspector,${csvCell(meta.inspectorName)}`,
    `Status,${csvCell(meta.status)}`,
    `Overall,${summary.totalEarned}/${summary.totalMax} (${summary.overallPercent}%)`,
    "",
    "Domain,Weight,Earned,Max,Percent",
    ...summary.domains.map(
      (d) =>
        `${csvCell(d.titleEn)},${d.weightPercent}%,${d.earnedPoints},${d.maxPoints},${d.percent}%`
    ),
    "",
    "Standard,Title,Earned,Max,Percent,Criteria Scored",
    ...summary.standards.map((s) => {
      const pct =
        s.maxPoints > 0 ? round((s.earnedPoints / s.maxPoints) * 100) : 0;
      return `${s.number},${csvCell(s.titleEn)},${s.earnedPoints},${s.maxPoints},${pct}%,${s.scoredCount}/${s.totalCriteria}`;
    }),
  ];
  return lines.join("\n");
}

/** Minimal DOCX-compatible XML wrapped document (Word opens as .docx). */
export function renderInspectionReportDocxXml(
  meta: InspectionReportMeta,
  summary: InspectionScoreSummary,
  narrative: {
    strengths?: string | null;
    gaps?: string | null;
    recommendations?: string | null;
    inspectorComments?: string | null;
    finalOutcome?: string | null;
  }
): string {
  const paragraphs = [
    "Internal Inspection Report",
    meta.frameworkTitle,
    meta.branchName,
    `Inspection date: ${meta.inspectionDate}`,
    `Inspector: ${meta.inspectorName}`,
    `Overall: ${summary.totalEarned}/${summary.totalMax} (${summary.overallPercent}%)`,
    "",
    "Domain performance:",
    ...summary.domains.map(
      (d) =>
        `${d.titleEn}: ${d.earnedPoints}/${d.maxPoints} (${d.percent}%)`
    ),
    "",
    "Standard performance:",
    ...summary.standards.map((s) => {
      const pct =
        s.maxPoints > 0 ? round((s.earnedPoints / s.maxPoints) * 100) : 0;
      return `Standard ${s.number}: ${s.earnedPoints}/${s.maxPoints} (${pct}%)`;
    }),
  ];

  if (narrative.strengths) paragraphs.push("", `Strengths: ${narrative.strengths}`);
  if (narrative.gaps) paragraphs.push(`Gaps: ${narrative.gaps}`);
  if (narrative.recommendations)
    paragraphs.push(`Recommendations: ${narrative.recommendations}`);
  if (narrative.inspectorComments)
    paragraphs.push(`Inspector comments: ${narrative.inspectorComments}`);
  if (narrative.finalOutcome)
    paragraphs.push(`Final outcome: ${narrative.finalOutcome}`);

  const body = paragraphs
    .map((p) => `<w:p><w:r><w:t>${escapeXml(p)}</w:t></w:r></w:p>`)
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}</w:body>
</w:document>`;
}

function csvCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
