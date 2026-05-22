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
    <section id="organization" className="scroll-mt-28 mt-16 sm:mt-20">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-100 to-violet-100 px-4 py-1 text-xs font-bold uppercase tracking-wider text-indigo-800">
          <Network className="h-3.5 w-3.5" />
          How it works
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Built around{" "}
          <span className="bg-gradient-to-r from-violet-600 to-cyan-600 bg-clip-text text-transparent">
            roles & grade bands
          </span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Central office → branch staff → families. Same flow on every campus.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 via-orange-50/50 to-white p-6 shadow-lg shadow-amber-100/50 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-300/50">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                {CENTRAL_OFFICE.subtitle}
              </p>
              <h3 className="text-xl font-bold text-slate-900">{CENTRAL_OFFICE.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{CENTRAL_OFFICE.description}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center" aria-hidden>
          <ArrowDown className="h-5 w-5 text-violet-300" />
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-lg shadow-indigo-100/40 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Branch staff portals</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {BRANCH_STAFF_ROLES.map((role) => {
              const Icon = STAFF_ICONS[role.role] ?? Users;
              return (
                <div
                  key={role.role}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                      role.accent
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{role.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 to-white p-5 shadow-md">
            <h3 className="font-bold text-slate-900">Academic layers</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {ACADEMIC_LAYERS.map((l) => (
                <li key={l.label}>
                  <strong className="text-slate-800">{l.label}</strong> — {l.detail}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 to-white p-5 shadow-md">
            <h3 className="font-bold text-slate-900">Family portals</h3>
            <ul className="mt-3 space-y-2">
              {FAMILY_ROLES.map((r) => (
                <li key={r.role} className="text-sm text-slate-600">
                  <strong className="text-violet-800">{r.label}</strong> — {r.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Admins:{" "}
        <Link href="/admin/organization" className="font-semibold text-indigo-600 hover:underline">
          live hierarchy map
        </Link>
        <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
      </p>
    </section>
  );
}
