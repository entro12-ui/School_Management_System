import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { auth } from "@/lib/auth";
import { HR_NAV } from "@/lib/nav/hr-nav";
import {
  canAccessHr,
  getHrDashboardStats,
  resolveHrBranchId,
} from "@/lib/services/hr";
import {
  Briefcase,
  Calendar,
  GraduationCap,
  Network,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const MODULE_LINKS = [
  { href: "/hr/employees", label: "Employees", icon: Users },
  { href: "/hr/departments", label: "Departments & designations", icon: Network },
  { href: "/hr/attendance", label: "Attendance", icon: Calendar },
  { href: "/hr/leave", label: "Leave management", icon: Calendar },
  { href: "/hr/payroll", label: "Payroll", icon: Wallet },
  { href: "/hr/performance", label: "Performance reviews", icon: Briefcase },
  { href: "/hr/training", label: "Training", icon: GraduationCap },
  { href: "/hr/assets", label: "Assets", icon: Briefcase },
  { href: "/hr/recruitment", label: "Recruitment", icon: UserCheck },
  { href: "/hr/settings", label: "HR roles & manager", icon: UserCheck },
];

export default async function HrDashboardPage() {
  const session = await auth();
  if (!session?.user || !canAccessHr(session.user.role)) redirect("/login");

  const branchId = resolveHrBranchId(
    session.user.role,
    session.user.branchId
  );
  const stats = await getHrDashboardStats(branchId);

  return (
    <PortalShell
      title="Human Resources"
      subtitle={session.user.branchName ?? "Staff lifecycle & payroll"}
      nav={HR_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">HR dashboard</h1>
        <p className="text-slate-500">
          Employees, attendance, leave, payroll, performance, training, assets, and
          recruitment — scoped to your branch.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active employees" value={String(stats.employees)} icon={Users} />
        <StatCard title="Departments" value={String(stats.departments)} icon={Network} />
        <StatCard
          title="Pending leave"
          value={String(stats.pendingLeave)}
          icon={Calendar}
        />
        <StatCard title="Open job posts" value={String(stats.openJobs)} icon={UserCheck} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard title="Trainings" value={String(stats.trainings)} icon={GraduationCap} />
        <StatCard
          title="Assets available"
          value={String(stats.assetsAvailable)}
          icon={Briefcase}
        />
        <StatCard
          title="Payroll runs (this month)"
          value={String(stats.payrollThisMonth)}
          icon={Wallet}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">HR modules</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_LINKS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300"
            >
              <m.icon className="h-5 w-5 text-indigo-600" />
              <span className="font-medium text-slate-900">{m.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
