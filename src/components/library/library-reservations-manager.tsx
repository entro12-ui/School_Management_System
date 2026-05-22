"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelLibraryReservation } from "@/lib/actions/library";

type Row = {
  id: string;
  bookTitle: string;
  bookAvailable: number;
  borrowerName: string;
  borrowerCode: string;
  status: string;
  reservedAt: string;
  readyAt: string | null;
};

export function LibraryReservationsManager({
  branchId,
  reservations,
}: {
  branchId: string;
  reservations: Row[];
}) {
  const [pending, startTransition] = useTransition();

  function cancel(id: string) {
    startTransition(async () => {
      await cancelLibraryReservation(id);
      window.location.reload();
    });
  }

  if (reservations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
        No active reservations.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Book</th>
            <th className="px-4 py-3 font-medium">Borrower</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Reserved</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {reservations.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium">{r.bookTitle}</td>
              <td className="px-4 py-3">
                {r.borrowerName}
                <span className="block text-xs text-slate-400">{r.borrowerCode}</span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    r.status === "READY"
                      ? "font-medium text-emerald-700"
                      : "text-amber-700"
                  }
                >
                  {r.status}
                </span>
                {r.bookAvailable > 0 && r.status === "PENDING" && (
                  <span className="block text-xs text-slate-400">Copy available now</span>
                )}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(r.reservedAt).toLocaleDateString("en-ET", { dateStyle: "medium" })}
              </td>
              <td className="px-4 py-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => cancel(r.id)}
                >
                  Cancel
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
