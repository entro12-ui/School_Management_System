import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assertSuperAdminCanAccessBranch } from "@/lib/auth/super-admin-scope";
import {
  renderInspectionReportCsv,
  renderInspectionReportDocxXml,
  renderInspectionReportHtml,
} from "@/lib/inspection/export";
import { getInspectionRunDetail } from "@/lib/services/inspection";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { runId } = await context.params;
  const detail = await getInspectionRunDetail(runId);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { run, framework, summary } = detail;

  if (session.user.role === UserRole.BRANCH_ADMIN) {
    if (session.user.branchId !== run.branchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.user.role === UserRole.SUPER_ADMIN) {
    const access = await assertSuperAdminCanAccessBranch(session.user, run.branchId);
    if (!access.ok) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "html";
  const issuedAt = new Date().toLocaleString("en-ET", { dateStyle: "long" });

  const meta = {
    branchName: run.branch.name,
    organizationName: run.branch.organization?.name,
    inspectionDate: run.inspectionDate.toLocaleDateString("en-ET", {
      dateStyle: "long",
    }),
    academicYearName: run.academicYear?.name,
    inspectorName: `${run.inspector.firstName} ${run.inspector.lastName}`,
    supervisorName: run.supervisor
      ? `${run.supervisor.firstName} ${run.supervisor.lastName}`
      : null,
    status: run.status,
    frameworkTitle: framework.version.titleEn,
    issuedAt,
  };

  const narrative = {
    strengths: run.strengths,
    gaps: run.gaps,
    recommendations: run.recommendations,
    inspectorComments: run.inspectorComments,
    finalOutcome: run.finalOutcome,
  };

  if (format === "csv") {
    const body = renderInspectionReportCsv(meta, summary);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inspection-${runId}.csv"`,
      },
    });
  }

  if (format === "docx") {
    const xml = renderInspectionReportDocxXml(meta, summary, narrative);
    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="inspection-${runId}.docx"`,
      },
    });
  }

  const html = renderInspectionReportHtml(meta, framework, summary, narrative);
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
