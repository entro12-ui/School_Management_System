import Link from "next/link";
import { PortalShell } from "@/components/layout/portal-shell";
import { DashboardGraphs } from "@/components/dashboard/dashboard-graphs";
import { LibraryBranchPicker } from "@/components/library/library-branch-picker";
import { StatCard } from "@/components/dashboard/stat-card";
import { auth } from "@/lib/auth";
import { LIBRARY_NAV } from "@/lib/nav/library-nav";
import { getLibraryDashboardCharts } from "@/lib/services/dashboard-charts";
import {
  canAccessLibrary,
  getLibraryPageBranch,
  getLibraryStats,
} from "@/lib/services/library";
import {
  BookOpen,
  ClipboardList,
  AlertCircle,
  Monitor,
  Calendar,
  Wallet,
  Users,
  BarChart3,
} from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LibraryPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !canAccessLibrary(session.user.role)) redirect("/login");

  const params = await searchParams;
  const { branchId, branches, branch, isSuperAdmin } = await getLibraryPageBranch(
    session.user,
    params.branchId
  );

  if (!branchId) {
    return (
      <PortalShell title="Library" nav={LIBRARY_NAV}>
        <p className="text-slate-500">No branch configured.</p>
      </PortalShell>
    );
  }

  const [stats, charts] = await Promise.all([
    getLibraryStats(branchId),
    getLibraryDashboardCharts(branchId),
  ]);

  return (
    <PortalShell
      title="Library"
      subtitle={branch?.name ?? "Books & lending"}
      nav={LIBRARY_NAV}
    >
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Librarian dashboard</h1>
      <p className="mb-6 text-slate-500">
        Catalog books, issue loans to students, process returns, and track overdue fines.
      </p>

      {isSuperAdmin && (
        <LibraryBranchPicker branchId={branchId} branches={branches} basePath="/library" />
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Titles in catalog" value={String(stats.totalBooks)} icon={BookOpen} />
        <StatCard title="Copies available" value={String(stats.availableCopies)} icon={BookOpen} />
        <StatCard title="Books on loan" value={String(stats.activeLoans)} icon={ClipboardList} />
        <StatCard title="Overdue" value={String(stats.overdueLoans)} icon={AlertCircle} />
        <StatCard
          title="Reservations"
          value={String(stats.pendingReservations)}
          icon={Calendar}
        />
        <StatCard title="Unpaid fines" value={String(stats.pendingFines)} icon={Wallet} />
      </div>

      {charts.length > 0 && <DashboardGraphs charts={charts} />}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            href: `/library/catalog${isSuperAdmin ? `?branchId=${branchId}` : ""}`,
            icon: BookOpen,
            title: "Book catalog",
            desc: "Titles, ISBN, barcodes, grade bands, shelves",
            highlight: true,
          },
          {
            href: `/library/issue${isSuperAdmin ? `?branchId=${branchId}` : ""}`,
            icon: ClipboardList,
            title: "Issue & return",
            desc: "Scan IDs, borrow limits, due dates, fines",
          },
          {
            href: `/library/reservations${isSuperAdmin ? `?branchId=${branchId}` : ""}`,
            icon: Calendar,
            title: "Reservations",
            desc: "Holds and ready-to-pickup queue",
          },
          {
            href: `/library/fines${isSuperAdmin ? `?branchId=${branchId}` : ""}`,
            icon: Wallet,
            title: "Fines",
            desc: "Overdue penalties and payments",
          },
          {
            href: `/library/accounts${isSuperAdmin ? `?branchId=${branchId}` : ""}`,
            icon: Users,
            title: "Borrower accounts",
            desc: "Students and teachers with active loans",
          },
          {
            href: `/library/digital${isSuperAdmin ? `?branchId=${branchId}` : ""}`,
            icon: Monitor,
            title: "Digital library",
            desc: `${stats.digitalCount} eBook / PDF / media links`,
          },
          {
            href: `/library/reports${isSuperAdmin ? `?branchId=${branchId}` : ""}`,
            icon: BarChart3,
            title: "Reports",
            desc: "Most borrowed, readers, inventory by band",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 rounded-xl border p-6 transition hover:border-indigo-300 ${
              item.highlight
                ? "border-indigo-200 bg-indigo-50"
                : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            <item.icon className="h-10 w-10 shrink-0 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-900">{item.title}</h2>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </PortalShell>
  );
}
