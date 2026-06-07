import { PortalShell } from "@/components/layout/portal-shell";
import { Button } from "@/components/ui/button";
import { MonthlyReportGenerator } from "@/components/admin/monthly-report-generator";
import { getAdminMonthlyReportBranchOptions } from "@/lib/services/admin-monthly-report";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";

import { ADMIN_NAV } from "@/lib/nav/admin-nav";

export const dynamic = "force-dynamic";

const exportReportTypes = [
  { name: "Consolidated enrollment (KG–12)", formats: ["PDF", "Excel", "CSV"] },
  { name: "Branch comparison — attendance & fees", formats: ["PDF", "Excel"] },
  { name: "National exam pass rate (Grades 10 & 12)", formats: ["PDF", "Excel"] },
  { name: "Audit log export (MoE-ready)", formats: ["PDF", "CSV"] },
  { name: "Financial — revenue & outstanding", formats: ["PDF", "Excel", "CSV"] },
];

export default async function AdminReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const orgScope = getOrganizationScope(session.user);
  const reportBranches = await getAdminMonthlyReportBranchOptions(orgScope);

  return (
    <PortalShell title="Super Admin" subtitle="Reports center" nav={ADMIN_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Reports center</h1>
        <p className="mt-2 text-slate-500">
          Generate AI monthly reports and access audit-ready exports for leadership review.
        </p>
      </div>

      <MonthlyReportGenerator branches={reportBranches} />

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Quick export shortcuts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Standard report formats for Ministry of Education and internal review.
          </p>
        </div>

        <div className="space-y-4">
          {exportReportTypes.map((report) => (
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
      </section>
    </PortalShell>
  );
}
