import { PortalShell } from "@/components/layout/portal-shell";
import { PlatformMailSetupNotice } from "@/components/platform/platform-mail-setup-notice";
import { PlatformSchoolQueue } from "@/components/platform/platform-school-queue";
import { auth } from "@/lib/auth";
import { PLATFORM_NAV } from "@/lib/nav/platform-nav";
import { getAllSchoolSignupsForClient } from "@/lib/services/school-signups";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlatformSchoolsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PLATFORM_ADMIN") redirect("/login");

  const signups = await getAllSchoolSignupsForClient();

  return (
    <PortalShell title="Platform Owner" subtitle="School signups" nav={PLATFORM_NAV}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">School registrations</h1>
        <p className="text-slate-500">
          Approve applications so schools can pay and receive their workspace.
        </p>
      </div>

      <PlatformMailSetupNotice />

      <PlatformSchoolQueue requests={signups} />
    </PortalShell>
  );
}
