"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Crown,
  GraduationCap,
  Layers,
  Network,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrganizationBranch } from "@/lib/services/organization";
import {
  ACADEMIC_LAYERS,
  BRANCH_STAFF_ROLES,
  CENTRAL_OFFICE,
  FAMILY_ROLES,
  INTEGRATED_MODULES,
  type OrgRoleNode,
} from "@/lib/organization-hierarchy";
import type { UserRole } from "@prisma/client";

type ViewMode = "diagram" | "roles" | "modules";

type OrganizationHierarchyProps = {
  branches?: OrganizationBranch[];
  centralAdmins?: number;
  highlightBranchId?: string;
  variant?: "marketing" | "admin" | "branch";
  showPortalLinks?: boolean;
};

const ROLE_ICONS: Record<string, typeof Users> = {
  BRANCH_ADMIN: Shield,
  REGISTRAR: ClipboardList,
  TEACHER: GraduationCap,
  FINANCE_OFFICER: Wallet,
  LIBRARIAN: BookOpen,
  PARENT: Users,
  STUDENT: GraduationCap,
};

function RoleCard({
  role,
  count,
  showLink,
}: {
  role: OrgRoleNode;
  count?: number;
  showLink?: boolean;
}) {
  const Icon = ROLE_ICONS[role.role] ?? Users;
  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/20 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        showLink && "cursor-pointer"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90",
          role.accent
        )}
      />
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
            role.accent
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{role.label}</p>
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {count}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{role.description}</p>
        </div>
        {showLink && (
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500" />
        )}
      </div>
    </div>
  );

  if (showLink) {
    return (
      <Link href={role.portalHref} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl">
        {inner}
      </Link>
    );
  }
  return inner;
}

function Connector() {
  return (
    <div className="flex justify-center py-2" aria-hidden>
      <div className="h-8 w-px bg-gradient-to-b from-indigo-300 to-slate-200" />
    </div>
  );
}

function BranchNode({
  branch,
  expanded,
  onToggle,
  highlighted,
  showStats,
  showPortalLinks,
}: {
  branch: OrganizationBranch;
  expanded: boolean;
  onToggle: () => void;
  highlighted?: boolean;
  showStats?: boolean;
  showPortalLinks?: boolean;
}) {
  const staffTotal = BRANCH_STAFF_ROLES.reduce(
    (sum, r) => sum + (branch.roleCounts[r.role] ?? 0),
    0
  );

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition",
        highlighted
          ? "border-indigo-400 ring-2 ring-indigo-100"
          : "border-slate-200 hover:border-indigo-200",
        !branch.isActive && "opacity-70"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-5 text-left transition hover:bg-slate-50/80"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-900">{branch.name}</h3>
            <span className="font-mono text-xs text-slate-400">{branch.code}</span>
            {highlighted && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                Your branch
              </span>
            )}
            {!branch.isActive && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                Inactive
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{branch.city}</p>
          {showStats && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "Students", value: branch.students },
                { label: "Staff", value: branch.staff || staffTotal },
                { label: "Classes", value: branch.classes },
              ].map((s) => (
                <span
                  key={s.label}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {s.value} {s.label.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="mt-1 rounded-lg p-1 text-slate-400">
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/80 to-white px-5 pb-5 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Branch staff portals
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {BRANCH_STAFF_ROLES.map((role) => (
              <RoleCard
                key={role.role}
                role={role}
                count={branch.roleCounts[role.role as UserRole]}
                showLink={showPortalLinks}
              />
            ))}
          </div>
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Academic structure
          </p>
          <div className="flex flex-wrap gap-2">
            {ACADEMIC_LAYERS.map((layer, i) => (
              <div key={layer.label} className="flex items-center gap-2">
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
                  <span className="font-medium text-slate-900">{layer.label}</span>
                  <span className="text-slate-400"> · {layer.detail}</span>
                </span>
                {i < ACADEMIC_LAYERS.length - 1 && (
                  <ChevronRight className="hidden h-3.5 w-3.5 text-slate-300 sm:block" />
                )}
              </div>
            ))}
          </div>
          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Family portals
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FAMILY_ROLES.map((role) => (
              <RoleCard
                key={role.role}
                role={role}
                count={branch.roleCounts[role.role as UserRole]}
                showLink={showPortalLinks}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export function OrganizationHierarchy({
  branches = [],
  centralAdmins = 1,
  highlightBranchId,
  variant = "marketing",
  showPortalLinks = true,
}: OrganizationHierarchyProps) {
  const [view, setView] = useState<ViewMode>("diagram");
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    if (highlightBranchId) initial.add(highlightBranchId);
    else if (branches[0]) initial.add(branches[0].id);
    return initial;
  });

  const displayBranches = useMemo(
    () =>
      [...branches].sort((a, b) => {
        if (a.id === highlightBranchId) return -1;
        if (b.id === highlightBranchId) return 1;
        return a.name.localeCompare(b.name);
      }),
    [branches, highlightBranchId]
  );

  const showLiveStats = variant !== "marketing" || branches.length > 0;
  const compactHeader = variant === "branch";

  function toggleBranch(id: string) {
    setExpandedBranches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const views: { id: ViewMode; label: string; icon: typeof Network }[] = [
    { id: "diagram", label: "Diagram", icon: Network },
    { id: "roles", label: "All roles", icon: Users },
    { id: "modules", label: "Modules", icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          compactHeader && "sm:items-end"
        )}
      >
        {!compactHeader ? (
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Multi-branch · role-based access
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Organization hierarchy
            </h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Central office oversees every branch. Each branch runs staff portals; families
              connect through parent and student accounts — all synced in real time.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Your place in the org</h2>
            <p className="mt-1 text-sm text-slate-500">
              How this branch fits under central office and connects to family portals.
            </p>
          </div>
        )}
        <div className="flex shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                view === v.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <v.icon className="h-4 w-4" />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === "roles" && (
        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Central
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5 sm:col-span-2 lg:col-span-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 text-white">
                  <Crown className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold text-slate-900">Super Admin</p>
                <p className="mt-1 text-sm text-slate-600">{CENTRAL_OFFICE.description}</p>
                {showPortalLinks && (
                  <Link
                    href="/admin"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
                  >
                    Admin portal <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Per branch
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BRANCH_STAFF_ROLES.map((role) => (
                <RoleCard key={role.role} role={role} showLink={showPortalLinks} />
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Families
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {FAMILY_ROLES.map((role) => (
                <RoleCard key={role.role} role={role} showLink={showPortalLinks} />
              ))}
            </div>
          </section>
        </div>
      )}

      {view === "modules" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATED_MODULES.map((mod) => (
            <div
              key={mod.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{mod.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{mod.description}</p>
              <ul className="mt-4 space-y-2">
                {mod.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {view === "diagram" && (
        <div className="space-y-0">
          {/* Central office */}
          <div className="relative mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 p-6 text-white shadow-lg shadow-indigo-200/50">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <Crown className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                      Level 1 · Central
                    </p>
                    <h3 className="text-xl font-bold">{CENTRAL_OFFICE.title}</h3>
                    <p className="mt-1 text-sm text-indigo-100">{CENTRAL_OFFICE.subtitle}</p>
                  </div>
                </div>
                {showLiveStats && (
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur">
                      {centralAdmins} super admin{centralAdmins === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur">
                      {displayBranches.filter((b) => b.isActive).length} active branches
                    </span>
                  </div>
                )}
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {CENTRAL_OFFICE.capabilities.map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-sm text-indigo-50">
                    <span className="h-1 w-1 rounded-full bg-emerald-300" />
                    {cap}
                  </li>
                ))}
              </ul>
              {showPortalLinks && variant !== "branch" && (
                <Link
                  href="/admin"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Open super admin
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <Connector />

          <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-400">
            Real-time sync
          </p>

          <Connector />

          {/* Branches */}
          <div>
            <p className="mb-4 text-center text-sm font-medium text-slate-600">
              Level 2 · School branches
              {displayBranches.length > 0 && (
                <span className="text-slate-400">
                  {" "}
                  · {displayBranches.length} configured
                </span>
              )}
            </p>
            {displayBranches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
                Branches appear here once configured in the database (e.g. after seed).
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {displayBranches.map((branch) => (
                  <BranchNode
                    key={branch.id}
                    branch={branch}
                    expanded={expandedBranches.has(branch.id)}
                    onToggle={() => toggleBranch(branch.id)}
                    highlighted={branch.id === highlightBranchId}
                    showStats={showLiveStats}
                    showPortalLinks={showPortalLinks}
                  />
                ))}
              </div>
            )}
          </div>

          <Connector />

          {/* Modules strip */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-6">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Level 3 · Integrated modules (all branches)
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {INTEGRATED_MODULES.map((mod) => (
                <div
                  key={mod.id}
                  className="rounded-xl border border-slate-100 bg-white p-4 text-center shadow-sm"
                >
                  <p className="font-semibold text-slate-900">{mod.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{mod.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
