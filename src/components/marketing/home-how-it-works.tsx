import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Crown,
  GraduationCap,
  Layers,
  Network,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import {
  ACADEMIC_LAYERS,
  BRANCH_STAFF_ROLES,
  CENTRAL_OFFICE,
  FAMILY_ROLES,
} from "@/lib/organization-hierarchy";
import { cn } from "@/lib/utils";

const STAFF_ICONS: Record<string, typeof Users> = {
  BRANCH_ADMIN: Shield,
  REGISTRAR: ClipboardList,
  TEACHER: GraduationCap,
  FINANCE_OFFICER: Wallet,
  LIBRARIAN: BookOpen,
};

export function HomeHowItWorks() {
  return (
    <section id="organization" className="scroll-mt-28 mt-20">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          <Network className="h-3.5 w-3.5" />
          How the system works
        </div>
        <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          Central office → branch staff → families
        </h2>
        <p className="mt-2 leading-relaxed text-slate-600">
          The system is organized by <strong>role</strong> and <strong>grade band</strong>.
          Super Admin oversees all campuses; each branch uses the same staff portals; parents and
          students sign in separately.
        </p>
      </div>

      <div className="mt-10 space-y-6">
        {/* Central */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/80">
                {CENTRAL_OFFICE.subtitle}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">{CENTRAL_OFFICE.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {CENTRAL_OFFICE.description}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {CENTRAL_OFFICE.capabilities.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-amber-200/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center" aria-hidden>
          <ArrowDown className="h-6 w-6 text-indigo-300" />
        </div>

        {/* Branch staff — roles only */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Branch operations</h3>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Each campus uses the same role-based portals — registrar, teachers, finance, library,
            and HR — managed by a branch admin.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BRANCH_STAFF_ROLES.map((role) => {
              const Icon = STAFF_ICONS[role.role] ?? Users;
              return (
                <div
                  key={role.role}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
                      role.accent
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{role.label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {role.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center" aria-hidden>
          <ArrowDown className="h-6 w-6 text-indigo-300" />
        </div>

        {/* Academic + family */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">Academic structure</h3>
            <p className="mt-1 text-sm text-slate-500">KG through Grade 12 on every branch</p>
            <ul className="mt-4 space-y-3">
              {ACADEMIC_LAYERS.map((layer) => (
                <li
                  key={layer.label}
                  className="rounded-lg border border-slate-100 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-slate-800">{layer.label}</span>
                  <span className="text-slate-500"> — {layer.detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900">Family portals</h3>
            <p className="mt-1 text-sm text-slate-500">Linked to enrolled students</p>
            <ul className="mt-4 space-y-3">
              {FAMILY_ROLES.map((role) => (
                <li
                  key={role.role}
                  className="flex gap-3 rounded-lg border border-slate-100 p-3"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                      role.accent
                    )}
                  >
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{role.label}</p>
                    <p className="text-xs text-slate-500">{role.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Super Admins can open the live hierarchy with branch stats in{" "}
        <Link
          href="/admin/organization"
          className="font-medium text-indigo-600 hover:underline"
        >
          Admin → Organization
        </Link>
        <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
      </p>
    </section>
  );
}
