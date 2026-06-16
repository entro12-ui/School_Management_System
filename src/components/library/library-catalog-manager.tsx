"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Field, Input, Select } from "@/components/ui/input";
import { deleteLibraryBook, saveLibraryBook } from "@/lib/actions/library";
import { BOOK_CATEGORIES, BOOK_SUBJECTS, GRADE_BAND_OPTIONS } from "@/lib/library/constants";
import type { LibraryBookRow } from "@/lib/services/library";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function LibraryCatalogManager({
  branchId,
  books: initialBooks,
}: {
  branchId: string;
  books: LibraryBookRow[];
}) {
  const router = useRouter();
  const [books] = useState(initialBooks);
  const [editing, setEditing] = useState<LibraryBookRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleDelete = useCallback(
    (id: string, title: string) => {
      if (!confirm(`Remove "${title}" from the catalog?`)) return;
      setMessage(null);
      setError(null);
      startTransition(async () => {
        const result = await deleteLibraryBook(id, branchId);
        if (result.success) {
          setMessage(result.message);
          router.refresh();
        } else setError(result.error);
      });
    },
    [branchId, router]
  );

  const columns = useMemo<DataTableColumn<LibraryBookRow>[]>(
    () => [
      {
        id: "title",
        header: "Title",
        sortable: true,
        sortValue: (r) => r.title,
        cell: (r) => (
          <div>
            <span className="font-medium text-slate-900">{r.title}</span>
            {r.author && <p className="text-xs text-slate-500">{r.author}</p>}
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        sortable: true,
        sortValue: (r) => r.category ?? "",
        cell: (r) => r.category ?? "—",
      },
      {
        id: "gradeBand",
        header: "Level",
        cell: (r) => r.gradeBand ?? "—",
      },
      {
        id: "shelf",
        header: "Shelf",
        cell: (r) => r.shelfLocation ?? "—",
      },
      {
        id: "copies",
        header: "Copies",
        sortable: true,
        sortValue: (r) => r.available,
        cell: (r) => (
          <span>
            {r.available} / {r.totalCopies}
            {r.onLoan > 0 && (
              <span className="ml-1 text-xs text-indigo-600">({r.onLoan} on loan)</span>
            )}
          </span>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: (r) => (r.isDigital ? "Digital" : "Physical"),
      },
      {
        id: "status",
        header: "Status",
        cell: (r) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              r.status === BookStatus.AVAILABLE
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {r.status}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (r) => (
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => {
                setAdding(false);
                setEditing(r);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={pending || r.onLoan > 0}
              onClick={() => handleDelete(r.id, r.title)}
              title={r.onLoan > 0 ? "Return all loans first" : "Delete"}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [pending, handleDelete]
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveLibraryBook(formData);
      if (result.success) {
        setMessage(result.message);
        setEditing(null);
        setAdding(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Add textbooks, reference books, and digital titles. Physical books can be issued to
          students.
        </p>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setAdding(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add book
        </Button>
      </div>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <DataTable
        data={books}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search title, author, ISBN…"
        getSearchText={(r) =>
          [r.title, r.author, r.isbn, r.category].filter(Boolean).join(" ")
        }
        emptyMessage="No books in catalog. Add your first title."
        recordLabel="book"
      />

      {(adding || editing) && (
        <BookFormModal
          branchId={branchId}
          book={editing}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
          pending={pending}
        />
      )}
    </div>
  );
}

function BookFormModal({
  branchId,
  book,
  onClose,
  onSubmit,
  pending,
}: {
  branchId: string;
  book: LibraryBookRow | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">
          {book ? "Edit book" : "Add book"}
        </h3>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input type="hidden" name="branchId" value={branchId} />
          {book && <input type="hidden" name="bookId" value={book.id} />}
          <Field label="Title *">
            <Input name="title" defaultValue={book?.title} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Author">
              <Input name="author" defaultValue={book?.author ?? ""} />
            </Field>
            <Field label="ISBN">
              <Input name="isbn" defaultValue={book?.isbn ?? ""} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select name="category" defaultValue={book?.category ?? "Textbook"}>
                {BOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Grade band">
              <Select name="gradeBand" defaultValue={book?.gradeBandEnum ?? ""}>
                <option value="">All levels</option>
                {GRADE_BAND_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject">
              <Select name="subject" defaultValue={book?.subject ?? ""}>
                <option value="">—</option>
                {BOOK_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Shelf / location">
              <Input name="shelfLocation" defaultValue={book?.shelfLocation ?? ""} />
            </Field>
          </div>
          <Field label="Barcode / QR">
            <Input
              name="barcode"
              defaultValue={book?.barcode ?? ""}
              placeholder="Leave blank to auto-generate"
            />
          </Field>
          <Field label="Total copies *">
            <Input
              name="totalCopies"
              type="number"
              min={1}
              defaultValue={book?.totalCopies ?? 1}
              required
            />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="isDigital"
              value="true"
              defaultChecked={book?.isDigital}
              className="rounded border-slate-300"
            />
            Digital resource (not issued physically)
          </label>
          <Field label="Digital URL (eBook / PDF / video)">
            <Input
              name="digitalUrl"
              type="url"
              defaultValue={book?.digitalUrl ?? ""}
              placeholder="https://…"
            />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
