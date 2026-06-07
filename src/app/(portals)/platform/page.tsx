import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { PlatformSchoolQueue } from "@/components/platform/platform-school-queue";
import { auth } from "@/lib/auth";
import { PLATFORM_NAV } from "@/lib/nav/platform-nav";
import {
  getAllSchoolSignupsForClient,
  getPlatformDashboardStats,
} from "@/lib/services/school-signups";
import { Building2, Clock, School, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlatformDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") redirect("/login");

  const [stats, signups] = await Promise.all([
    getPlatformDashboardStats(),
    getAllSchoolSignupsForClient(),
  ]);
  const pending = signups.filter((s) => s.status === "PENDING");

  return (
    <PortalShell
      title="Platform Owner"
      subtitle="EduSync SMS SaaS"
      nav={PLATFORM_NAV}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">SaaS dashboard</h1>
        <p className="text-slate-500">
          Review school registrations, collect{" "}
          <strong>{stats.pricePerStudent} ETB per student</strong>, and activate workspaces.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Pending applications"
          value={String(stats.pendingSignups)}
          icon={Clock}
        />
        <StatCard
          title="Unpaid (approved)"
          value={String(stats.approvedAwaitingPayment)}
          icon={Building2}
        />
        <StatCard
          title="Active schools"
          value={String(stats.activeOrganizations)}
          icon={School}
        />
        <StatCard
          title="Students on platform"
          value={String(stats.totalStudents)}
          icon={Users}
        />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Pending school signups</h2>
        <Link href="/platform/schools" className="text-sm font-medium text-indigo-600 hover:underline">
          View all →
        </Link>
      </div>

      <PlatformSchoolQueue requests={pending} />
    </PortalShell>
  );
}
