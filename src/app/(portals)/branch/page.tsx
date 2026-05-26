import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { requireBranchAdmin } from "@/lib/auth/branch-session";
import { BRANCH_NAV } from "@/lib/nav/branch-nav";
import { getGradeBandBreakdown } from "@/lib/services/dashboard";
import {
  getBranchGradeLevelBreakdown,
  getBranchOverview,
} from "@/lib/services/branch-admin";
import { OrganizationHierarchySection } from "@/components/organization/organization-hierarchy-section";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { getBranchDashboardCharts } from "@/lib/services/dashboard-charts";
import { formatPercent } from "@/lib/utils";
import {
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  MapPin,
  Phone,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/branch/students", label: "Students", desc: "KG–12 roster", icon: Users },
  { href: "/branch/staff", label: "Staff", desc: "Teachers & office", icon: GraduationCap },
  { href: "/branch/classes", label: "Classes", desc: "Sections & homerooms", icon: BookOpen },
  { href: "/finance/payments", label: "Fee payments", desc: "Semester tuition", icon: Wallet },
  { href: "/registrar/enroll", label: "Enroll user", desc: "New accounts + OTP", icon: UserCheck },
  { href: "/branch/registrations", label: "Staff applications", desc: "Registrar & HR Manager", icon: ClipboardList },
];

export default async function BranchAdminPage() {
  const { branchId, branchName } = await requireBranchAdmin();

  const [overview, gradeLevels, gradeBands, charts] = await Promise.all([
    getBranchOverview(branchId),
    getBranchGradeLevelBreakdown(branchId),
    getGradeBandBreakdown(branchId),
    getBranchDashboardCharts(branchId),
  ]);

  const b = overview.branch;
  const c = overview.counts;
  const m = overview.metrics;

  return (
    <PortalShell title="Branch Admin" subtitle={branchName} nav={BRANCH_NAV}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{b.name}</h1>
          <p className="text-slate-500">
            Branch control center — your data only (students, staff, fees, enrollment).
          </p>
          {c.pendingRegistrations > 0 && (
            <p className="mt-3 text-sm font-medium text-amber-700">
              {c.pendingRegistrations} staff application
              {c.pendingRegistrations === 1 ? "" : "s"} (Registrar or HR Manager) awaiting
              approval —{" "}
              <Link href="/branch/registrations" className="underline">
                Review now
              </Link>
            </p>
          )}
        </div>
        <Link href="/branch/reports">
          <Button variant="outline">Branch reports</Button>
        </Link>
      </div>

      <article className="mb-8 rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-6 w-6 text-indigo-600" />
          <div className="flex-1 text-sm">
            <p className="font-mono text-xs text-indigo-600">{b.code}</p>
            <p className="mt-1 flex items-center gap-1 text-slate-700">
              <MapPin className="h-3.5 w-3.5" />
              {b.city}
              {b.address ? ` · ${b.address}` : ""}
            </p>
            {b.phone && (
              <p className="mt-1 flex items-center gap-1 text-slate-600">
                <Phone className="h-3.5 w-3.5" />
                {b.phone}
              </p>
            )}
            <p className="mt-2 text-slate-500">Academic year: {b.currentYear}</p>
          </div>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Students" value={String(c.students)} subtitle="Active KG–12" icon={Users} />
        <StatCard
          title="Attendance today"
          value={m.formatted.attendance}
          icon={ClipboardList}
        />
        <StatCard title="Revenue collected" value={m.formatted.revenue} icon={Wallet} />
        <StatCard title="Outstanding fees" value={m.formatted.outstanding} icon={GraduationCap} />
      </div>

      <DashboardGraphs charts={charts} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Staff" value={String(c.staff)} icon={GraduationCap} />
        <StatCard title="Classes" value={String(c.classes)} icon={BookOpen} />
        <StatCard title="Parents" value={String(c.parents)} icon={Users} />
        <StatCard title="Portal users" value={String(c.users)} icon={Users} />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <OrganizationHierarchySection
          variant="branch"
          highlightBranchId={branchId}
          showPortalLinks
        />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
            >
              <link.icon className="h-5 w-5 shrink-0 text-indigo-600" />
              <div>
                <p className="font-medium text-slate-900">{link.label}</p>
                <p className="text-xs text-slate-500">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Enrollment by grade</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gradeLevels.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-slate-500">
                    No students yet.{" "}
                    <Link href="/registrar/enroll" className="text-indigo-600 underline">
                      Enroll students
                    </Link>
                  </td>
                </tr>
              ) : (
                gradeLevels.map((g) => (
                  <tr key={g.gradeLevel} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{g.label}</td>
                    <td className="px-4 py-3">{g.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Financial snapshot</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Collected</dt>
              <dd className="font-medium text-emerald-600">{m.formatted.revenue}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Outstanding</dt>
              <dd className="font-medium text-amber-600">{m.formatted.outstanding}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Attendance rate today</dt>
              <dd className="font-medium">{formatPercent(m.attendanceRate)}</dd>
            </div>
          </dl>
          <Link
            href="/finance/payments"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Manage fee payments →
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Students by grade band</h3>
          <ul className="mt-4 space-y-2">
            {gradeBands.map((g) => (
              <li key={g.band} className="flex justify-between text-sm">
                <span className="text-slate-600">{g.band.replace(/_/g, " ")}</span>
                <span className="font-medium">{g.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        You see only <strong>{b.name}</strong> data. Global settings and other branches are
        managed by the central super admin.
      </p>
    </PortalShell>
  );
}
