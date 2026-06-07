import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { CreateBranchForm } from "@/components/admin/create-branch-form";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { getBranchesOverview } from "@/lib/services/admin";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Building2, MapPin, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminBranchesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const orgScope = getOrganizationScope(session.user);
  const branches = await getBranchesOverview(orgScope);
  const canCreateBranches = Boolean(orgScope);

  return (
    <PortalShell title="Super Admin" subtitle="Branch management" nav={ADMIN_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Branches</h1>
        <p className="text-slate-500">
          {canCreateBranches
            ? "Manage campuses under your school organization."
            : "All school branches — enrollment, staff, and academic year per location."}
        </p>
      </div>

      {canCreateBranches && (
        <div className="mb-8">
          <CreateBranchForm />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {branches.map((b) => (
          <article
            key={b.id}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              b.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <div>
                  <h2 className="font-semibold text-slate-900">{b.name}</h2>
                  <p className="text-xs font-mono text-slate-400">{b.code}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  b.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {b.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <p className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {b.city}
                {b.address ? ` · ${b.address}` : ""}
              </p>
              {b.phone && (
                <p className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {b.phone}
                </p>
              )}
              <p className="text-slate-500">Academic year: {b.currentYear}</p>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Students</dt>
                <dd className="font-semibold text-slate-900">{b.students}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Staff</dt>
                <dd className="font-semibold text-slate-900">{b.staff}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Classes</dt>
                <dd className="font-semibold text-slate-900">{b.classes}</dd>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">Users</dt>
                <dd className="font-semibold text-slate-900">{b.users}</dd>
              </div>
            </dl>

            <Link
              href="/branch"
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Open branch portal →
            </Link>
          </article>
        ))}
      </div>

      {branches.length === 0 && (
        <p className="text-center text-slate-500">No branches configured.</p>
      )}
    </PortalShell>
  );
}
