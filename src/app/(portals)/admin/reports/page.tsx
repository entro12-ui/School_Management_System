import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

import { ADMIN_NAV } from "@/lib/nav/admin-nav";

const reportTypes = [
  { name: "Consolidated enrollment (KG–12)", formats: ["PDF", "Excel", "CSV"] },
  { name: "Branch comparison — attendance & fees", formats: ["PDF", "Excel"] },
  { name: "National exam pass rate (Grades 10 & 12)", formats: ["PDF", "Excel"] },
  { name: "Audit log export (MoE-ready)", formats: ["PDF", "CSV"] },
  { name: "Financial — revenue & outstanding", formats: ["PDF", "Excel", "CSV"] },
];

export default function AdminReportsPage() {
  return (
    <PortalShell title="Super Admin" subtitle="Export reports" nav={ADMIN_NAV}>
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Export reports</h1>
      <p className="mb-8 text-slate-500">Audit-ready exports for Ministry of Education review</p>

      <div className="space-y-4">
        {reportTypes.map((report) => (
          <div
            key={report.name}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-slate-900">{report.name}</p>
              <p className="text-sm text-slate-500">
                Formats: {report.formats.join(" · ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {report.formats.includes("PDF") && (
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4" /> PDF
                </Button>
              )}
              {report.formats.includes("Excel") && (
                <Button variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </Button>
              )}
              {report.formats.includes("CSV") && (
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" /> CSV
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PortalShell>
  );
}
