import { PortalShell } from "@/components/layout/portal-shell";
import { OrganizationAccessToggle } from "@/components/platform/organization-access-toggle";
import { auth } from "@/lib/auth";
import { PLATFORM_NAV } from "@/lib/nav/platform-nav";
import { getActiveOrganizations } from "@/lib/services/school-signups";
import { Building2, MapPin } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlatformOrganizationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") redirect("/login");

  const organizations = await getActiveOrganizations();

  return (
    <PortalShell title="Platform Owner" subtitle="Active schools" nav={PLATFORM_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Active schools</h1>
        <p className="text-slate-500">
          Schools with paid subscriptions and provisioned workspaces.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {organizations.map((org) => {
          const studentCount = org.branches.reduce(
            (sum, branch) => sum + branch._count.students,
            0
          );

          return (
            <article
              key={org.id}
              className={`rounded-xl border bg-white p-5 shadow-sm ${
                org.isActive ? "border-slate-200" : "border-slate-200 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h2 className="font-semibold text-slate-900">{org.name}</h2>
                    <p className="text-xs font-mono text-slate-400">{org.code}</p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    org.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {org.isActive ? "Active" : "Suspended"}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {org.city}
                </p>
                <p>{org.contactEmail}</p>
                <p className="text-slate-500">
                  {org._count.branches} branch(es) · {studentCount} students · limit{" "}
                  {org.studentLimit}
                </p>
                {org.signupRequest?.platformPayments[0] ? (
                  <p className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                    Paid{" "}
                    {Number(org.signupRequest.platformPayments[0].amount).toLocaleString()} ETB
                    {org.signupRequest.platformPayments[0].paidAt
                      ? ` · ${new Date(org.signupRequest.platformPayments[0].paidAt).toLocaleDateString()}`
                      : ""}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">Payment record not linked</p>
                )}
              </div>

              <OrganizationAccessToggle organizationId={org.id} isActive={org.isActive} />
            </article>
          );
        })}
      </div>

      {organizations.length === 0 && (
        <p className="text-center text-slate-500">No active schools yet.</p>
      )}
    </PortalShell>
  );
}
