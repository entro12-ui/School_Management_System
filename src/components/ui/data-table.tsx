"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";

export type SortDir = "asc" | "desc";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  headerClassName?: string;
  cellClassName?: string;
};

export type DataTableFilter<T> = {
  id: string;
  label: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  predicate: (row: T, value: string) => boolean;
};

export type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  getSearchText?: (row: T) => string;
  filters?: DataTableFilter<T>[];
  pageSize?: number;
  pageSizeOptions?: number[];
  emptyMessage?: string;
  toolbar?: ReactNode;
  minWidth?: string;
  recordLabel?: string;
};

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = "Search…",
  getSearchText,
  filters = [],
  pageSize: defaultPageSize = 15,
  pageSizeOptions = [10, 15, 25, 50],
  emptyMessage = "No records match your filters.",
  toolbar,
  minWidth = "640px",
  recordLabel = "record",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((f) => [f.id, f.defaultValue ?? "all"]))
  );
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data.filter((row) => {
      for (const f of filters) {
        const val = filterValues[f.id] ?? "all";
        if (val !== "all" && !f.predicate(row, val)) return false;
      }
      if (!q) return true;
      const haystack = (getSearchText?.(row) ?? "").toLowerCase();
      return haystack.includes(q);
    });

    if (sortKey) {
      const col = columns.find((c) => c.id === sortKey);
      if (col?.sortable && col.sortValue) {
        rows = [...rows].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv));
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    return rows;
  }, [data, search, filterValues, filters, sortKey, sortDir, columns, getSearchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageStart = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, filtered.length);
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(columnId: string) {
    const col = columns.find((c) => c.id === columnId);
    if (!col?.sortable) return;
    if (sortKey === columnId) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(columnId);
      setSortDir("asc");
    }
    setPage(1);
  }

  function SortIcon({ columnId }: { columnId: string }) {
    if (sortKey !== columnId) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  }

  function setFilter(id: string, value: string) {
    setFilterValues((prev) => ({ ...prev, [id]: value }));
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="min-w-[200px] flex-1">
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </Field>
        </div>
        {filters.map((f) => (
          <Field key={f.id} label={f.label}>
            <Select
              value={filterValues[f.id] ?? "all"}
              onChange={(e) => setFilter(f.id, e.target.value)}
            >
              <option value="all">All</option>
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        ))}
        {toolbar}
        <p className="pb-2 text-sm text-slate-500 lg:ml-auto">
          {filtered.length} {recordLabel}
          {filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-slate-100 bg-slate-50 text-slate-600">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-3 py-3 font-medium ${col.headerClassName ?? ""}`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-slate-900"
                      onClick={() => toggleSort(col.id)}
                    >
                      {col.header}
                      <SortIcon columnId={col.id} />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-slate-50">
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={`px-3 py-3 ${col.cellClassName ?? ""}`}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-slate-500">
            Showing {pageStart}–{pageEnd} of {filtered.length}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {pageSizeOptions.length > 1 && (
              <Field label="Rows per page">
                <Select
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {pageSizeOptions.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
