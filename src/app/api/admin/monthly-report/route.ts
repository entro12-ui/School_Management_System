import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getAdminMonthlyReport } from "@/lib/services/admin-monthly-report";

export const runtime = "nodejs";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id };
}

export async function GET(request: Request) {
  const guard = await requireSuperAdmin();
  if ("error" in guard) return guard.error;

  const url = new URL(request.url);
  const now = new Date();
  const month = Number(url.searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(url.searchParams.get("year") ?? now.getFullYear());
  const branchId = url.searchParams.get("branchId") || null;

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "month must be between 1 and 12." }, { status: 400 });
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "year must be valid." }, { status: 400 });
  }

  try {
    const report = await getAdminMonthlyReport({ month, year, branchId });
    return NextResponse.json(report);
  } catch (error) {
    console.error("[admin-monthly-report] failed:", error);
    return NextResponse.json(
      { error: "Could not generate monthly report. Please try again." },
      { status: 500 }
    );
  }
}
