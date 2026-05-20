import { PortalShell } from "@/components/layout/portal-shell";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import { getLibraryDashboardCharts } from "@/lib/services/dashboard-charts";
import { BookOpen, RotateCcw, Monitor, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const branchId = session.user.branchId;
  const charts = branchId ? await getLibraryDashboardCharts(branchId) : [];

  return (
    <PortalShell title="Library" subtitle="Books & digital resources" nav={LIBRARY_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Librarian dashboard</h1>

      {charts.length > 0 && <DashboardGraphs charts={charts} />}

      <div className={`grid gap-4 md:grid-cols-2 ${charts.length > 0 ? "mt-8" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Book catalog
            </CardTitle>
            <CardDescription>Physical & digital inventory</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Manage ISBN records, categories, copies available, and e-resources.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-indigo-600" />
              Issue & return
            </CardTitle>
            <CardDescription>Student lending workflow</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Track due dates, returns, and overdue items by student ID.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-indigo-600" />
              E-resources
            </CardTitle>
            <CardDescription>Digital library access</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Link digital textbooks and reference materials to grade levels.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-indigo-600" />
              Fine management
            </CardTitle>
            <CardDescription>Late return penalties</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Calculate fines and sync with finance for collection if needed.
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}
