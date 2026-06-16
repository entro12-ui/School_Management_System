import Link from "next/link";
import { AlertTriangle, Clock, Package } from "lucide-react";

type Alerts = {
  lowStock: { id: string; name: string; sku: string; total: number; minStock: number }[];
  expiring: { id: string; name: string; expiryDate: string }[];
  damaged: { id: string; assetCode: string; itemName: string }[];
};

export function InventoryAlertsPanel({ alerts, branchId }: { alerts: Alerts; branchId: string }) {
  const q = branchId ? `?branchId=${branchId}` : "";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <AlertCard
        title="Low stock"
        icon={Package}
        count={alerts.lowStock.length}
        color="amber"
        href={`/inventory/items${q}`}
      >
        {alerts.lowStock.length === 0 ? (
          <p className="text-sm text-slate-500">All items above minimum threshold.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.lowStock.map((item) => (
              <li key={item.id} className="text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-slate-500">
                  {" "}
                  — {item.total}/{item.minStock} min ({item.sku})
                </span>
              </li>
            ))}
          </ul>
        )}
      </AlertCard>

      <AlertCard
        title="Expiring soon"
        icon={Clock}
        count={alerts.expiring.length}
        color="orange"
        href={`/inventory/items${q}`}
      >
        {alerts.expiring.length === 0 ? (
          <p className="text-sm text-slate-500">No items expiring within 30 days.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.expiring.map((item) => (
              <li key={item.id} className="text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-slate-500"> — expires {item.expiryDate}</span>
              </li>
            ))}
          </ul>
        )}
      </AlertCard>

      <AlertCard
        title="Damaged assets"
        icon={AlertTriangle}
        count={alerts.damaged.length}
        color="red"
        href={`/inventory/assets${q}`}
      >
        {alerts.damaged.length === 0 ? (
          <p className="text-sm text-slate-500">No damaged assets reported.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.damaged.map((a) => (
              <li key={a.id} className="text-sm">
                <span className="font-mono text-xs">{a.assetCode}</span>
                <span className="text-slate-500"> — {a.itemName}</span>
              </li>
            ))}
          </ul>
        )}
      </AlertCard>
    </div>
  );
}

function AlertCard({
  title,
  icon: Icon,
  count,
  color,
  href,
  children,
}: {
  title: string;
  icon: typeof Package;
  count: number;
  color: "amber" | "orange" | "red";
  href: string;
  children: React.ReactNode;
}) {
  const colors = {
    amber: "border-amber-200 bg-amber-50",
    orange: "border-orange-200 bg-orange-50",
    red: "border-red-200 bg-red-50",
  };
  const iconColors = {
    amber: "text-amber-600",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <div className={`rounded-xl border p-6 ${colors[color]}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColors[color]}`} />
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-sm font-medium">{count}</span>
      </div>
      {children}
      <Link href={href} className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
        View details →
      </Link>
    </div>
  );
}
