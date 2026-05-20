"use client";

import { useMemo, useState, useTransition } from "react";
import { AcademicTerm, PaymentStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { formatSemesterLabel } from "@/lib/semester-fees";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
} from "@/components/ui/data-table";
import { formatCurrency } from "@/lib/utils";
import {
  createSemesterInvoice,
  markSemesterFullyPaid,
  recordSemesterPayment,
  syncBranchSemesterInvoices,
} from "@/lib/actions/finance";
import type { StudentPaymentRow } from "@/lib/services/finance";

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-800",
  PENDING: "bg-amber-50 text-amber-800",
  PARTIAL: "bg-orange-50 text-orange-800",
  OVERDUE: "bg-red-50 text-red-800",
  LOCKED: "bg-slate-100 text-slate-500",
  NOT_INVOICED: "bg-slate-50 text-slate-600",
};

function statusLabel(status: string) {
  if (status === "NOT_INVOICED") return "Not invoiced";
  if (status === "LOCKED") return "Locked";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function getSem(row: StudentPaymentRow, term: AcademicTerm) {
  return row.semesters.find((s) => s.term === term);
}

function rowHasUnpaid(row: StudentPaymentRow) {
  const sem1 = getSem(row, AcademicTerm.SEMESTER_1);
  const sem2 = getSem(row, AcademicTerm.SEMESTER_2);
  return (
    sem1?.status !== PaymentStatus.PAID ||
    (sem2 != null &&
      sem2.status !== "LOCKED" &&
      sem2.status !== PaymentStatus.PAID)
  );
}

function rowIsFullyPaid(row: StudentPaymentRow) {
  return !rowHasUnpaid(row);
}

function rowHasOverdue(row: StudentPaymentRow) {
  return row.semesters.some((s) => s.status === PaymentStatus.OVERDUE);
}

function rowNeedsInvoice(row: StudentPaymentRow) {
  return row.semesters.some((s) => s.status === "NOT_INVOICED");
}

function semSortValue(sem: StudentPaymentRow["semesters"][number] | undefined) {
  if (!sem) return 9;
  const order: Record<string, number> = {
    OVERDUE: 0,
    PENDING: 1,
    PARTIAL: 2,
    LOCKED: 3,
    NOT_INVOICED: 4,
    PAID: 5,
  };
  return order[sem.status] ?? 6;
}

export function FinancePaymentsTable({
  rows,
  showBranch = false,
}: {
  rows: StudentPaymentRow[];
  showBranch?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) setMessage(res.message ?? "Done");
      else setError(res.error ?? "Something went wrong");
    });
  }

  const branchOptions = useMemo(() => {
    const names = [...new Set(rows.map((r) => r.branchName))].sort();
    return names.map((n) => ({ value: n, label: n }));
  }, [rows]);

  const filters = useMemo<DataTableFilter<StudentPaymentRow>[]>(() => {
    const list: DataTableFilter<StudentPaymentRow>[] = [
      {
        id: "payment",
        label: "Payment status",
        options: [
          { value: "unpaid", label: "Unpaid / partial" },
          { value: "paid", label: "Fully paid" },
          { value: "overdue", label: "Overdue" },
          { value: "not_invoiced", label: "Not invoiced" },
        ],
        predicate: (r, value) => {
          if (value === "unpaid") return rowHasUnpaid(r);
          if (value === "paid") return rowIsFullyPaid(r);
          if (value === "overdue") return rowHasOverdue(r);
          if (value === "not_invoiced") return rowNeedsInvoice(r);
          return true;
        },
      },
    ];
    if (branchOptions.length > 1) {
      list.push({
        id: "branch",
        label: "Branch",
        options: branchOptions,
        predicate: (r, value) => r.branchName === value,
      });
    }
    return list;
  }, [branchOptions]);

  const columns = useMemo<DataTableColumn<StudentPaymentRow>[]>(() => {
    const cols: DataTableColumn<StudentPaymentRow>[] = [
      {
        id: "student",
        header: "Student",
        sortable: true,
        sortValue: (r) => `${r.lastName} ${r.firstName}`,
        cell: (r) => (
          <div>
            <p className="font-medium text-slate-900">
              {r.firstName} {r.lastName}
            </p>
            <p className="font-mono text-xs text-slate-500">{r.studentCode}</p>
          </div>
        ),
      },
    ];

    if (showBranch) {
      cols.push({
        id: "branch",
        header: "Branch",
        sortable: true,
        sortValue: (r) => r.branchName,
        cell: (r) => r.branchName,
      });
    }

    cols.push(
      {
        id: "grade",
        header: "Grade / class",
        sortable: true,
        sortValue: (r) => r.gradeLabel,
        cell: (r) => (
          <div>
            <p>{r.gradeLabel}</p>
            <p className="text-xs text-slate-400">{r.className}</p>
          </div>
        ),
      },
      {
        id: "sem1",
        header: (
          <div>
            <div>Semester 1</div>
            <div className="text-xs font-normal text-slate-400">5 months</div>
          </div>
        ),
        sortable: true,
        sortValue: (r) => semSortValue(getSem(r, AcademicTerm.SEMESTER_1)),
        cellClassName: "align-top min-w-[140px]",
        cell: (r) => <SemesterCell sem={getSem(r, AcademicTerm.SEMESTER_1)} />,
      },
      {
        id: "sem2",
        header: (
          <div>
            <div>Semester 2</div>
            <div className="text-xs font-normal text-slate-400">5 months</div>
          </div>
        ),
        sortable: true,
        sortValue: (r) => semSortValue(getSem(r, AcademicTerm.SEMESTER_2)),
        cellClassName: "align-top min-w-[140px]",
        cell: (r) => <SemesterCell sem={getSem(r, AcademicTerm.SEMESTER_2)} />,
      },
      {
        id: "balance",
        header: "Balance due",
        sortable: true,
        sortValue: (r) => totalBalanceDue(r),
        cell: (r) => {
          const due = totalBalanceDue(r);
          return (
            <span
              className={
                due > 0 ? "font-semibold text-amber-700" : "text-emerald-600"
              }
            >
              {formatCurrency(due)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cellClassName: "align-top min-w-[240px]",
        cell: (r) => (
          <SemesterActions
            row={r}
            payingId={payingId}
            setPayingId={setPayingId}
            amount={amount}
            setAmount={setAmount}
            reference={reference}
            setReference={setReference}
            pending={pending}
            run={run}
          />
        ),
      }
    );

    return cols;
  }, [
    showBranch,
    payingId,
    amount,
    reference,
    pending,
  ]);

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>
      )}

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.studentId}
        searchPlaceholder="Search name, ID, grade, class, branch…"
        getSearchText={(r) =>
          [
            r.studentCode,
            r.firstName,
            r.lastName,
            r.gradeLabel,
            r.className,
            r.branchName,
            ...r.semesters.map((s) => statusLabel(s.status)),
          ].join(" ")
        }
        filters={filters}
        pageSize={15}
        minWidth="1100px"
        recordLabel="student"
        emptyMessage="No students match your search or filters."
        toolbar={
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => run(syncBranchSemesterInvoices)}
          >
            Sync Semester 1 invoices
          </Button>
        }
      />
    </div>
  );
}

function totalBalanceDue(row: StudentPaymentRow) {
  return row.semesters.reduce((sum, s) => {
    if (!s.paymentId || s.status === "LOCKED" || s.status === "NOT_INVOICED") {
      return sum;
    }
    return sum + Math.max(0, s.amount - s.paidAmount);
  }, 0);
}

function SemesterCell({
  sem,
}: {
  sem: StudentPaymentRow["semesters"][number] | undefined;
}) {
  if (!sem) return <span className="text-slate-300">—</span>;

  return (
    <div className="space-y-1">
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          STATUS_BADGE[sem.status] ?? "bg-slate-100"
        }`}
      >
        {statusLabel(sem.status)}
      </span>
      {sem.paymentId && (
        <>
          <p className="text-slate-900">
            {formatCurrency(sem.paidAmount)}{" "}
            <span className="text-slate-400">/ {formatCurrency(sem.amount)}</span>
          </p>
          {sem.dueDate && (
            <p className="text-xs text-slate-400">
              Due{" "}
              {new Date(sem.dueDate).toLocaleDateString("en-ET", {
                dateStyle: "medium",
              })}
            </p>
          )}
        </>
      )}
      {sem.status === "LOCKED" && (
        <p className="text-xs text-slate-400">Pay Semester 1 first</p>
      )}
    </div>
  );
}

type PaymentActionOption = {
  value: string;
  label: string;
  group: "paid" | "record" | "invoice";
};

function canPaySemester(sem: StudentPaymentRow["semesters"][number] | undefined) {
  return (
    !!sem?.paymentId &&
    sem.status !== PaymentStatus.PAID &&
    sem.status !== "LOCKED" &&
    sem.status !== "NOT_INVOICED"
  );
}

function buildPaymentActions(row: StudentPaymentRow): PaymentActionOption[] {
  const sem1 = getSem(row, AcademicTerm.SEMESTER_1);
  const sem2 = getSem(row, AcademicTerm.SEMESTER_2);
  const actions: PaymentActionOption[] = [];

  for (const sem of [sem1, sem2]) {
    if (!canPaySemester(sem) || !sem?.paymentId) continue;
    const label = formatSemesterLabel(sem.term);
    actions.push({
      value: `mark:${sem.paymentId}`,
      label: `${label} — fully paid`,
      group: "paid",
    });
    actions.push({
      value: `record:${sem.paymentId}`,
      label: `${label} — record payment`,
      group: "record",
    });
  }

  const unpaidIds = [sem1, sem2]
    .filter(canPaySemester)
    .map((s) => s!.paymentId!);

  if (unpaidIds.length >= 2) {
    actions.push({
      value: `mark_all:${unpaidIds.join(",")}`,
      label: "Full year — both semesters fully paid",
      group: "paid",
    });
  }

  if (row.canAdvance) {
    actions.push({
      value: "open_sem2",
      label: "Create Semester 2 invoice",
      group: "invoice",
    });
  }

  return actions;
}

function SemesterActions({
  row,
  payingId,
  setPayingId,
  amount,
  setAmount,
  reference,
  setReference,
  pending,
  run,
}: {
  row: StudentPaymentRow;
  payingId: string | null;
  setPayingId: (id: string | null) => void;
  amount: string;
  setAmount: (v: string) => void;
  reference: string;
  setReference: (v: string) => void;
  pending: boolean;
  run: (action: () => Promise<{ success: boolean; message?: string; error?: string }>) => void;
}) {
  const [selectKey, setSelectKey] = useState(0);
  const actions = useMemo(() => buildPaymentActions(row), [row]);
  const recordingSem = row.semesters.find((s) => s.paymentId === payingId);

  if (recordingSem?.paymentId) {
    return (
      <form
        className="flex min-w-[220px] flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData();
          fd.set("paymentId", recordingSem.paymentId!);
          fd.set("amount", amount);
          fd.set("reference", reference);
          run(async () => {
            const res = await recordSemesterPayment(fd);
            if (res.success) setPayingId(null);
            return res;
          });
        }}
      >
        <p className="text-xs font-medium text-slate-600">
          {formatSemesterLabel(recordingSem.term)} — partial payment
        </p>
        <Field label="Amount (ETB)">
          <Input
            type="number"
            min={1}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Field>
        <Field label="Reference">
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Receipt #"
          />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setPayingId(null)}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  if (actions.length === 0) {
    if (row.allPaid) {
      return <span className="text-xs font-medium text-emerald-600">Fully paid</span>;
    }
    return <span className="text-xs text-slate-400">No actions</span>;
  }

  const paidActions = actions.filter((a) => a.group === "paid");
  const recordActions = actions.filter((a) => a.group === "record");
  const invoiceActions = actions.filter((a) => a.group === "invoice");

  function handleAction(value: string) {
    if (value.startsWith("mark:")) {
      run(() => markSemesterFullyPaid(value.slice(5)));
    } else if (value.startsWith("mark_all:")) {
      const ids = value.slice(9).split(",").filter(Boolean);
      run(async () => {
        for (const id of ids) {
          const res = await markSemesterFullyPaid(id);
          if (!res.success) return res;
        }
        return { success: true, message: "Full year marked as fully paid." };
      });
    } else if (value.startsWith("record:")) {
      const paymentId = value.slice(7);
      const sem = row.semesters.find((s) => s.paymentId === paymentId);
      if (!sem) return;
      setPayingId(paymentId);
      const remaining = sem.amount - sem.paidAmount;
      setAmount(String(remaining > 0 ? remaining : sem.amount));
      setReference("");
    } else if (value === "open_sem2") {
      run(() => createSemesterInvoice(row.studentId, AcademicTerm.SEMESTER_2));
    }
    setSelectKey((k) => k + 1);
  }

  return (
    <Select
      key={selectKey}
      className="min-w-[220px] text-sm"
      defaultValue=""
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        if (!value) return;
        handleAction(value);
      }}
    >
      <option value="" disabled>
        Choose action…
      </option>
      {paidActions.length > 0 && (
        <optgroup label="Mark fully paid">
          {paidActions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </optgroup>
      )}
      {recordActions.length > 0 && (
        <optgroup label="Record payment">
          {recordActions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </optgroup>
      )}
      {invoiceActions.length > 0 && (
        <optgroup label="Invoices">
          {invoiceActions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}

