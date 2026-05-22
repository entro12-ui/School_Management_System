"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { payLibraryFine } from "@/lib/actions/library";

type FineRow = {
  id: string;
  bookTitle: string;
  borrowerName: string;
  amount: number;
  paidAmount: number;
  status: string;
  createdAt: string;
};

export function LibraryFinesManager({
  branchId,
  fines,
}: {
  branchId: string;
  fines: FineRow[];
}) {
  const [pending, startTransition] = useTransition();

  function markPaid(fineId: string) {
    const fd = new FormData();
    fd.set("fineId", fineId);
    fd.set("branchId", branchId);
    startTransition(async () => {
      await payLibraryFine(fd);
      window.location.reload();
    });
  }

  const pendingFines = fines.filter((f) => f.status === "PENDING");

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {pendingFines.length} unpaid fine{pendingFines.length === 1 ? "" : "s"}. Collect at the
        library or mark paid after finance receives payment.
      </p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Book</th>
              <th className="px-4 py-3 font-medium">Borrower</th>
              <th className="px-4 py-3 font-medium">Amount (ETB)</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fines.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No fines on record.
                </td>
              </tr>
            ) : (
              fines.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3">{f.bookTitle}</td>
                  <td className="px-4 py-3">{f.borrowerName}</td>
                  <td className="px-4 py-3 font-medium">{f.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">{f.status}</td>
                  <td className="px-4 py-3">
                    {f.status === "PENDING" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={pending}
                        onClick={() => markPaid(f.id)}
                      >
                        Mark paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
