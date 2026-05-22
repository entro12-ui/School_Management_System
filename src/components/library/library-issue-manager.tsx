"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LibraryBorrowerType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import { issueLibraryBook, returnLibraryBook } from "@/lib/actions/library";
import { getBorrowingPolicy } from "@/lib/library/borrowing-rules";
import type { LibraryIssueRow } from "@/lib/services/library";
import { AlertCircle, BookMarked, RotateCcw } from "lucide-react";

type BorrowerOption = {
  id: string;
  userId: string;
  studentId?: string;
  gradeLevel: number;
  label: string;
};

type BookOption = {
  id: string;
  title: string;
  author: string | null;
  barcode: string | null;
  available: number;
};

export function LibraryIssueManager({
  branchId,
  activeIssues,
  overdueIssues,
  students,
  teachers,
  books,
  defaultDueDate,
}: {
  branchId: string;
  activeIssues: LibraryIssueRow[];
  overdueIssues: LibraryIssueRow[];
  students: BorrowerOption[];
  teachers: BorrowerOption[];
  books: BookOption[];
  defaultDueDate: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"issue" | "active" | "overdue">("issue");
  const [borrowerKind, setBorrowerKind] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState<LibraryIssueRow | null>(null);
  const [selectedBorrower, setSelectedBorrower] = useState<BorrowerOption | null>(null);
  const [pending, startTransition] = useTransition();

  const issueColumns = useMemo<DataTableColumn<LibraryIssueRow>[]>(
    () => [
      {
        id: "borrower",
        header: "Borrower",
        sortable: true,
        sortValue: (r) => r.borrowerName,
        cell: (r) => (
          <div>
            <span className="font-medium">{r.borrowerName}</span>
            <p className="text-xs text-slate-500">
              {r.borrowerCode} · {r.borrowerType} · {r.className ?? "—"}
            </p>
          </div>
        ),
      },
      {
        id: "book",
        header: "Book",
        cell: (r) => (
          <div>
            {r.bookTitle}
            {r.barcode && <p className="text-xs text-slate-400">{r.barcode}</p>}
          </div>
        ),
      },
      {
        id: "due",
        header: "Due",
        sortable: true,
        sortValue: (r) => new Date(r.dueDate).getTime(),
        cell: (r) => (
          <span className={r.isOverdue ? "font-medium text-red-600" : ""}>
            {new Date(r.dueDate).toLocaleDateString("en-ET", { dateStyle: "medium" })}
            {r.isOverdue && ` (${r.daysOverdue}d)`}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (r) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => setReturning(r)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Return
          </Button>
        ),
      },
    ],
    [pending]
  );

  function handleIssue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await issueLibraryBook(new FormData(e.currentTarget));
      if (result.success) {
        setMessage(result.message);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleReturn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!returning) return;
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await returnLibraryBook(new FormData(e.currentTarget));
      if (result.success) {
        setMessage(result.message);
        setReturning(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const borrowers = borrowerKind === "STUDENT" ? students : teachers;
  const samplePolicy = getBorrowingPolicy(
    borrowerKind === "STUDENT" ? 5 : 12,
    borrowerKind === "STUDENT"
      ? LibraryBorrowerType.STUDENT
      : LibraryBorrowerType.TEACHER
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {(
          [
            { id: "issue" as const, label: "Issue book", icon: BookMarked },
            { id: "active" as const, label: `On loan (${activeIssues.length})`, icon: BookMarked },
            { id: "overdue" as const, label: `Overdue (${overdueIssues.length})`, icon: AlertCircle },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
              tab === t.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      {tab === "issue" && (
        <form
          onSubmit={handleIssue}
          className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
          <input type="hidden" name="branchId" value={branchId} />
          <input
            type="hidden"
            name="borrowerType"
            value={
              borrowerKind === "STUDENT"
                ? LibraryBorrowerType.STUDENT
                : LibraryBorrowerType.TEACHER
            }
          />
          <h3 className="font-semibold text-slate-900">Issue book (scan or select)</h3>
          <p className="text-sm text-slate-500">
            Limits: {samplePolicy.maxBooks} books, {samplePolicy.loanDays} days ({samplePolicy.label}
            ). Overdue fines block new loans.
          </p>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={borrowerKind === "STUDENT" ? "default" : "outline"}
              size="sm"
              onClick={() => setBorrowerKind("STUDENT")}
            >
              Student
            </Button>
            <Button
              type="button"
              variant={borrowerKind === "TEACHER" ? "default" : "outline"}
              size="sm"
              onClick={() => setBorrowerKind("TEACHER")}
            >
              Teacher
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Scan student ID (optional)">
              <Input name="studentCodeScan" placeholder="STU-…" disabled={borrowerKind !== "STUDENT"} />
            </Field>
            <Field label="Scan book barcode (optional)">
              <Input name="bookBarcodeScan" placeholder="BK-… or ISBN" />
            </Field>
          </div>

          <Field label={borrowerKind === "STUDENT" ? "Student *" : "Teacher *"}>
            <Select
              required
              defaultValue=""
              onChange={(e) => {
                const opt = borrowers.find((b) => b.userId === e.target.value);
                setSelectedBorrower(opt ?? null);
              }}
            >
              <option value="" disabled>
                Select…
              </option>
              {borrowers.map((b) => (
                <option key={b.userId} value={b.userId}>
                  {b.label}
                </option>
              ))}
            </Select>
          </Field>
          <input type="hidden" name="borrowerUserId" value={selectedBorrower?.userId ?? ""} />
          <input type="hidden" name="studentId" value={selectedBorrower?.studentId ?? ""} />
          <input
            type="hidden"
            name="gradeLevel"
            value={selectedBorrower?.gradeLevel ?? 0}
          />

          <Field label="Book *">
            <Select name="bookId" required defaultValue="">
              <option value="" disabled>
                Select book…
              </option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                  {b.barcode ? ` [${b.barcode}]` : ""} ({b.available})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input name="dueDate" type="date" defaultValue={defaultDueDate} />
          </Field>
          <Field label="Notes">
            <Input name="notes" />
          </Field>
          <Button type="submit" disabled={pending || books.length === 0}>
            Issue book
          </Button>
        </form>
      )}

      {tab === "active" && (
        <DataTable
          data={activeIssues}
          columns={issueColumns}
          rowKey={(r) => r.id}
          searchPlaceholder="Search…"
          getSearchText={(r) => [r.borrowerName, r.bookTitle, r.borrowerCode].join(" ")}
          emptyMessage="No active loans."
          recordLabel="loan"
        />
      )}

      {tab === "overdue" && (
        <DataTable
          data={overdueIssues}
          columns={issueColumns}
          rowKey={(r) => r.id}
          emptyMessage="No overdue books."
          recordLabel="loan"
        />
      )}

      {returning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Return book</h3>
            <p className="mt-1 text-sm text-slate-600">
              {returning.bookTitle} — {returning.borrowerName}
            </p>
            {returning.fineWarning && (
              <p className="mt-2 text-sm text-amber-700">{returning.fineWarning}</p>
            )}
            {returning.suggestedFine > 0 && (
              <p className="text-sm text-red-700">
                Suggested fine: {returning.suggestedFine} ETB
              </p>
            )}
            <form onSubmit={handleReturn} className="mt-4 space-y-3">
              <input type="hidden" name="issueId" value={returning.id} />
              <Field label="Fine (ETB)">
                <Input
                  name="fineAmount"
                  type="number"
                  min={0}
                  defaultValue={returning.suggestedFine}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="waiveFine" value="true" className="rounded" />
                Waive fine
              </label>
              <Field label="Notes">
                <Input name="notes" />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" disabled={pending}>
                  Confirm return
                </Button>
                <Button type="button" variant="ghost" onClick={() => setReturning(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
