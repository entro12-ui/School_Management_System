import { READING_BADGE_THRESHOLDS } from "@/lib/library/borrowing-rules";
import type { getBorrowerLibraryAccount } from "@/lib/services/library-portal";

export function LibraryBorrowerAccount({
  account,
}: {
  account: NonNullable<Awaited<ReturnType<typeof getBorrowerLibraryAccount>>>;
}) {
  const badge = READING_BADGE_THRESHOLDS.filter(
    (t) => account.booksRead >= t.books
  ).at(-1);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
        <h2 className="font-semibold text-indigo-900">Your library account</h2>
        <p className="text-sm text-indigo-800">
          {account.user.name}
          {account.user.studentCode ? ` · ${account.user.studentCode}` : ""}
          {account.user.className ? ` · ${account.user.className}` : ""}
        </p>
        <p className="mt-2 text-sm text-indigo-700">
          Borrowing: {account.eligibility.activeLoans} / {account.eligibility.maxBooks}{" "}
          books ({account.eligibility.policyLabel})
        </p>
        {!account.eligibility.canBorrow && account.eligibility.reasons.length > 0 && (
          <ul className="mt-2 list-inside list-disc text-sm text-red-700">
            {account.eligibility.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
        {badge && (
          <p className="mt-2 text-sm font-medium text-indigo-900">
            Reading program: {badge.badge} ({account.booksRead} books completed)
          </p>
        )}
      </div>

      {account.activeLoans.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-slate-900">Currently borrowed</h3>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {account.activeLoans.map((l) => (
              <li key={l.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{l.bookTitle}</span>
                <span className="text-slate-500">
                  {" "}
                  — due{" "}
                  {new Date(l.dueDate).toLocaleDateString("en-ET", { dateStyle: "medium" })}
                  {l.isOverdue && (
                    <span className="ml-1 font-medium text-red-600">(overdue)</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {account.reservations.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-slate-900">Reservations</h3>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {account.reservations.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                {r.bookTitle} — <span className="text-indigo-600">{r.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {account.history.length > 0 && (
        <section>
          <h3 className="mb-2 font-semibold text-slate-900">Reading history</h3>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {account.history.slice(0, 8).map((h, i) => (
              <li key={i} className="px-4 py-2 text-sm text-slate-600">
                {h.bookTitle} — returned{" "}
                {new Date(h.returnedAt).toLocaleDateString("en-ET", { dateStyle: "medium" })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-slate-500">
        Visit the school library to issue or return physical books. Digital titles open from the
        digital library list.
      </p>
    </div>
  );
}
