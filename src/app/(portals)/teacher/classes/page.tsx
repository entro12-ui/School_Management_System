import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeacherClassesTable } from "@/components/teacher/teacher-classes-table";
import { auth } from "@/lib/auth";
import { TEACHER_NAV } from "@/lib/nav/teacher-nav";
import { getTeacherClasses } from "@/lib/services/teacher";
import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, Home, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherClassesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getTeacherClasses(session.user.id);
  if (!data) redirect("/login");

  const { teacher, classes, stats } = data;
  const mySubjects = teacher.staffSubjects.map((s) => s.subject);

  return (
    <PortalShell
      title="My classes"
      subtitle={teacher.branch.name}
      nav={TEACHER_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My classes</h1>
        <p className="mt-1 text-slate-500">
          Sections where you are homeroom teacher or teach an assigned subject.
          {mySubjects.length > 0 && (
            <>
              {" "}
              Your subjects:{" "}
              <span className="font-medium text-slate-700">
                {mySubjects.map((s) => s.name).join(", ")}
              </span>
              .
            </>
          )}
        </p>
      </div>

      {classes.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            title="My classes"
            value={String(stats.classCount)}
            icon={GraduationCap}
          />
          <StatCard
            title="Homeroom sections"
            value={String(stats.homeroomCount)}
            icon={Home}
          />
          <StatCard
            title="Students in my classes"
            value={String(stats.studentCount)}
            icon={Users}
          />
        </div>
      )}

      {classes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <GraduationCap className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 font-medium text-slate-700">No classes linked yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Ask your branch admin to assign you subjects and homeroom for each section.
          </p>
          <Link
            href="/teacher"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Search, filter, and jump to attendance, grading, or the class roster.
            </p>
            <Link
              href="/teacher/students"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
            >
              <BookOpen className="h-4 w-4" />
              Browse by grade
            </Link>
          </div>
          <TeacherClassesTable classes={classes} />
        </>
      )}
    </PortalShell>
  );
}
