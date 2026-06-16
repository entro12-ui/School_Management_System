import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assertUserCanAccessBranch } from "@/lib/auth/super-admin-scope";
import {
  getPurchaseHistoryReport,
  getStockReport,
  renderPurchaseHistoryCsv,
  renderStockReportCsv,
} from "@/lib/services/inventory-reports";
import { canViewInventoryReports } from "@/lib/services/inventory";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !canViewInventoryReports(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const branchId = request.nextUrl.searchParams.get("branchId");
  const type = request.nextUrl.searchParams.get("type") ?? "stock";
  const format = request.nextUrl.searchParams.get("format") ?? "csv";

  if (!branchId) {
    return NextResponse.json({ error: "branchId required" }, { status: 400 });
  }

  const access = await assertUserCanAccessBranch(session.user, branchId);
  if (!access.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (format !== "csv") {
    return NextResponse.json({ error: "Only CSV export supported" }, { status: 400 });
  }

  if (type === "stock") {
    const rows = await getStockReport(branchId);
    const body = renderStockReportCsv(rows);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-stock-${branchId}.csv"`,
      },
    });
  }

  if (type === "purchase") {
    const rows = await getPurchaseHistoryReport(branchId);
    const body = renderPurchaseHistoryCsv(rows);
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inventory-purchases-${branchId}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
