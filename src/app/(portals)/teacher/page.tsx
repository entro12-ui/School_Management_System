import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import {
  getTeacherByUserId,
  getTeacherClasses,
  getTeacherDashboardStats,
} from "@/lib/services/teacher";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { getTeacherDashboardCharts } from "@/lib/services/dashboard-charts";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherPortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) redirect("/login");

  const [stats, classData, charts] = await Promise.all([
    getTeacherDashboardStats(teacher.id, teacher.branchId),
    getTeacherClasses(session.user.id),
    getTeacherDashboardCharts(teacher.branchId),
  ]);

  const subjects = teacher.staffSubjects.map((s) => s.subject);
  const classStats = classData?.stats ?? {
    classCount: 0,
    homeroomCount: 0,
    studentCount: 0,
  };

  return (
    <PortalShell
      title="Teacher Portal"
      subtitle={teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {teacher.user.firstName}
        </h1>
        <p className="text-slate-500">
          {subjects.length > 0
            ? `Teaching: ${subjects.map((s) => s.name).join(", ")}`
            : "No subjects assigned yet"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="My subjects" value={String(stats.subjectCount)} icon={BookOpen} />
        <StatCard
          title="My classes"
          value={String(classStats.classCount)}
          icon={GraduationCap}
        />
        <StatCard
          title="My students"
          value={String(classStats.studentCount)}
          icon={Users}
        />
        <StatCard
          title="Present today (branch)"
          value={String(stats.presentToday)}
          icon={ClipboardList}
        />
        <StatCard
          title="Assessments entered"
          value={String(stats.assessmentCount)}
          icon={ClipboardCheck}
        />
      </div>

      <DashboardGraphs charts={charts} />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My classes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            {classStats.classCount > 0 ? (
              <>
                {classStats.classCount} section{classStats.classCount === 1 ? "" : "s"}
                {classStats.homeroomCount > 0 &&
                  ` · ${classStats.homeroomCount} homeroom`}
                . Open attendance, grading, or rosters from one place.
              </>
            ) : (
              <>No classes linked yet — ask your branch admin to assign subjects and homeroom.</>
            )}
            <Link
              href="/teacher/classes"
              className="mt-3 block font-medium text-indigo-600 hover:underline"
            >
              View my classes →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Grading system</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Set column weights to 100 marks, then enter marks per student for your subjects.
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium">
              <Link href="/teacher/grading" className="text-indigo-600 hover:underline">
                Full assessment →
              </Link>
              <Link
                href="/teacher/grading/single"
                className="text-indigo-600 hover:underline"
              >
                Single assessment →
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weekly attendance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Mark each student present Mon–Fri for your class sections, then save the week.
            <Link
              href="/teacher/attendance"
              className="mt-3 block font-medium text-indigo-600 hover:underline"
            >
              Open weekly sheet →
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Parent Communication Bot</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Draft multilingual progress reports, attendance alerts, and fee reminders for parents
            using live student data.
            <Link
              href="/teacher/parent-communication"
              className="mt-3 block font-medium text-indigo-600 hover:underline"
            >
              Open parent communication →
            </Link>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  );
}
