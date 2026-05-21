import { PortalShell } from "@/components/layout/portal-shell";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { STUDENT_NAV } from "@/lib/nav/student-nav";
import { getStudentDashboardCharts } from "@/lib/services/dashboard-charts";
import { getStudentByUserId } from "@/lib/services/student";
import { BookOpen, Calendar, FileText, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const student = await getStudentByUserId(session.user.id);
  const charts = student
    ? await getStudentDashboardCharts(student.id)
    : [];

  return (
    <PortalShell title="Student Portal" subtitle="Assignments, exams & progress" nav={STUDENT_NAV}>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Student dashboard</h1>

      {charts.length > 0 && <DashboardGraphs charts={charts} />}

      <div className={`grid gap-4 md:grid-cols-2 ${charts.length > 0 ? "mt-8" : ""}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" />
              Assignments
            </CardTitle>
            <CardDescription>Homework & class tasks</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            View pending and submitted assignments by subject.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Exam schedule
            </CardTitle>
            <CardDescription>Midterm, final & national prep</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Grade 10 & 12 national exam preparation timelines.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              GPA tracker
            </CardTitle>
            <CardDescription>Grades 9–12 cumulative GPA</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Track semester GPA and university readiness indicators.
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              Transcript download
            </CardTitle>
            <CardDescription>Official academic record</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              PDF, HTML, and CSV downloads for university applications.
            </p>
            <Link
              href="/student/transcript"
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Open transcript →
            </Link>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-indigo-600" />
              Fee status
            </CardTitle>
            <CardDescription>View tuition balance (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            See payment status linked to parent portal records.
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}
