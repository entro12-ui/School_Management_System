import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrganizationHierarchy } from "@/components/organization/organization-hierarchy";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { auth } from "@/lib/auth";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { getOrganizationHierarchy } from "@/lib/services/organization";
import { redirect } from "next/navigation";
import { Building2, GraduationCap, Network, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrganizationPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const orgScope = getOrganizationScope(session.user);
  const data = await getOrganizationHierarchy(orgScope);

  return (
    <PortalShell
      title="Organization"
      subtitle="Central Office — hierarchy & roles"
      nav={ADMIN_NAV}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organization hierarchy</h1>
          <p className="text-slate-500">
            Live view of branches, roles, and how data flows from central office to
            families.
          </p>
        </div>
        <Link
          href="/admin/branches"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Manage branches →
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active branches"
          value={String(data.totals.branches)}
          icon={Building2}
        />
        <StatCard
          title="Students (all branches)"
          value={String(data.totals.students)}
          icon={GraduationCap}
        />
        <StatCard
          title="Staff profiles"
          value={String(data.totals.staff)}
          icon={Users}
        />
        <StatCard
          title="Portal users"
          value={String(data.totals.users)}
          icon={Network}
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm sm:p-8">
        <OrganizationHierarchy
          branches={data.branches}
          centralAdmins={data.centralAdmins}
          variant="admin"
          showPortalLinks
        />
      </section>
    </PortalShell>
  );
}
