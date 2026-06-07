import { PortalShell } from "@/components/layout/portal-shell";
import { SystemSettingsForm } from "@/components/admin/system-settings-form";
import { ADMIN_NAV } from "@/lib/nav/admin-nav";
import { getAdminSummary } from "@/lib/services/admin";
import { getOrganizationScope } from "@/lib/auth/organization-scope";
import { ensureSystemSettings, getSystemSettings } from "@/lib/system-settings";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  await ensureSystemSettings();
  const orgScope = getOrganizationScope(session.user);
  const [settings, summary] = await Promise.all([
    getSystemSettings(),
    getAdminSummary(session.user),
  ]);

  return (
    <PortalShell title="Super Admin" subtitle="Global settings" nav={ADMIN_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Global settings</h1>
        <p className="text-slate-500">
          Central office configuration for {settings.schoolName}
          {orgScope ? " — your school branches." : "."}
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active branches</p>
          <p className="text-2xl font-bold text-slate-900">{summary.branches}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Portal users</p>
          <p className="text-2xl font-bold text-slate-900">{summary.users}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Audit entries</p>
          <p className="text-2xl font-bold text-slate-900">{summary.auditCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending registrar apps</p>
          <p className="text-2xl font-bold text-slate-900">{summary.pendingRegistrations}</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <SystemSettingsForm settings={settings} />
      </section>

      <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Enrollment policy:</strong> Students and staff are registered by the registrar
        office with one-time passwords ({settings.otpExpiryDays}-day validity). Only registrar
        role applications require super admin / branch admin approval.
      </section>
    </PortalShell>
  );
}
