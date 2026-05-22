"use client";

import { useState, useTransition } from "react";
import type { GradeBand } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { reserveLibraryBook } from "@/lib/actions/library";
import type { PublicBookSearchRow } from "@/lib/services/library-portal";
import { Search } from "lucide-react";

export function LibraryPublicSearch({
  branchId,
  books: initialBooks,
  gradeBands,
  showReserve = true,
}: {
  branchId: string;
  books: PublicBookSearchRow[];
  gradeBands: { value: GradeBand; label: string }[];
  showReserve?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = initialBooks.filter((b) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [b.title, b.author, b.subject, b.category]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  function handleReserve(bookId: string) {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.set("branchId", branchId);
    fd.set("bookId", bookId);
    startTransition(async () => {
      const res = await reserveLibraryBook(fd);
      if (res.success) setMessage(res.message);
      else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <form method="get" className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-[200px] flex-1">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Title, author, subject…"
                className="pl-9"
              />
            </div>
          </Field>
        </div>
        <Field label="Grade level">
          <Select name="gradeBand" defaultValue="">
            <option value="">All levels</option>
            {gradeBands.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
      </form>

      {message && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{message}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="col-span-2 text-sm text-slate-500">No books match your search.</p>
        ) : (
          filtered.map((b) => (
            <article
              key={b.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <h3 className="font-semibold text-slate-900">{b.title}</h3>
              {b.author && <p className="text-sm text-slate-500">{b.author}</p>}
              <p className="mt-2 text-xs text-slate-500">
                {b.gradeBandLabel ?? "All levels"} · {b.subject ?? b.category ?? "General"}
                {b.shelfLocation ? ` · Shelf ${b.shelfLocation}` : ""}
              </p>
              <p className="mt-2 text-sm">
                {b.isDigital ? (
                  <span className="text-indigo-600">Digital resource</span>
                ) : b.available > 0 ? (
                  <span className="font-medium text-emerald-700">
                    {b.available} of {b.totalCopies} available
                  </span>
                ) : (
                  <span className="text-amber-700">On loan — reserve</span>
                )}
              </p>
              {showReserve && b.canReserve && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  disabled={pending}
                  onClick={() => handleReserve(b.id)}
                >
                  Reserve
                </Button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
