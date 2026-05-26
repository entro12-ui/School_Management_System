import { PortalShell } from "@/components/layout/portal-shell";
import type { NavItemConfig } from "@/lib/nav/icons";

export function HrModulePlaceholder({
  title,
  description,
  nav,
  subtitle,
}: {
  title: string;
  description: string;
  nav: NavItemConfig[];
  subtitle?: string;
}) {
  return (
    <PortalShell title="Human Resources" subtitle={subtitle ?? title} nav={nav}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 max-w-2xl text-slate-500">{description}</p>
      </div>
      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-8 text-center text-sm text-indigo-900">
        Database tables and navigation are ready. CRUD screens for this module can be
        built next on top of the Prisma models in <code className="text-xs">schema.prisma</code>.
      </div>
    </PortalShell>
  );
}
