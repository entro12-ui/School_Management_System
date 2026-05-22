import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Crown,
  GraduationCap,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import {
  BRANCH_STAFF_ROLES,
  FAMILY_ROLES,
} from "@/lib/organization-hierarchy";
import { ROLE_HOME } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Partial<Record<UserRole, typeof Users>> = {
  BRANCH_ADMIN: Shield,
  REGISTRAR: ClipboardList,
  TEACHER: GraduationCap,
  FINANCE_OFFICER: Wallet,
  LIBRARIAN: BookOpen,
  HR_OFFICER: Users,
  PARENT: Users,
  STUDENT: GraduationCap,
};

const CENTRAL = {
  label: "Super Admin",
  description: "Central office — all branches, settings, audit",
  href: ROLE_HOME.SUPER_ADMIN,
  accent: "from-amber-500 to-orange-600",
};

export function HomePortalsGrid() {
  return (
    <section id="portals" className="scroll-mt-28 mt-20">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Role portals
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          Sign in to the right workspace
        </h2>
        <p className="mt-2 text-slate-600">
          Each role has a dedicated portal. Demo accounts are available on the sign-in page.
        </p>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Central office
        </p>
        <PortalCard
          label={CENTRAL.label}
          description={CENTRAL.description}
          href={CENTRAL.href}
          accent={CENTRAL.accent}
          icon={Crown}
        />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Branch staff
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BRANCH_STAFF_ROLES.map((role) => (
            <PortalCard
              key={role.role}
              label={role.label}
              description={role.description}
              href={role.portalHref}
              accent={role.accent}
              icon={ROLE_ICONS[role.role] ?? Users}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Families
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FAMILY_ROLES.map((role) => (
            <PortalCard
              key={role.role}
              label={role.label}
              description={role.description}
              href={role.portalHref}
              accent={role.accent}
              icon={ROLE_ICONS[role.role] ?? Users}
            />
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        New staff?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Register for registrar or HR approval
        </Link>
      </p>
    </section>
  );
}

function PortalCard({
  label,
  description,
  href,
  accent,
  icon: Icon,
}: {
  label: string;
  description: string;
  href: string;
  accent: string;
  icon?: typeof Users;
}) {
  const IconComponent = Icon ?? Users;
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            accent
          )}
        >
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 group-hover:text-indigo-700">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
      </div>
    </Link>
  );
}
