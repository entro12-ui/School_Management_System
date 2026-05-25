"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, IdCard, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { generateHrEmployeeIdCard } from "@/lib/actions/hr-id-cards";
import type {
  GeneratedHrEmployeeIdCardRow,
  HrEmployeeIdCardEmployeeRow,
} from "@/lib/services/hr";

export function HrEmployeeIdCardGenerator({
  employees,
  generatedCards,
  showBranch,
}: {
  employees: HrEmployeeIdCardEmployeeRow[];
  generatedCards: GeneratedHrEmployeeIdCardRow[];
  showBranch: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState<GeneratedHrEmployeeIdCardRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeEmployees = employees.filter((e) => e.status === "ACTIVE");
  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return generatedCards;
    return generatedCards.filter((card) =>
      [
        card.cardNumber,
        card.employee.fullName,
        card.employee.employeeCode,
        card.employee.departmentName,
        card.employee.designationTitle,
        card.employee.schoolName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [generatedCards, search]);

  function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await generateHrEmployeeIdCard(formData);
      if (result.success) {
        setMessage(`${result.message} Card number: ${result.data?.cardNumber ?? ""}`.trim());
        form.reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body * { visibility: hidden !important; }
          .hr-id-card-modal-print, .hr-id-card-modal-print * { visibility: visible !important; }
          .hr-id-card-modal-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            background: white !important;
          }
          .hr-id-card-no-print { display: none !important; }
          .hr-employee-id-card {
            break-inside: avoid;
            page-break-inside: avoid;
            box-shadow: none !important;
            max-width: 110mm;
          }
        }
      `}</style>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
            <IdCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Create employee ID card</h2>
            <p className="text-sm text-slate-500">
              Select one employee, generate the ID card, then view or print it from the table.
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="grid gap-4 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
          <Field label="Employee *">
            <Select name="employeeId" required defaultValue="">
              <option value="" disabled>
                Select employee
              </option>
              {activeEmployees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName} — {e.employeeCode} — {e.designationTitle ?? "Staff"}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expires at">
            <Input name="expiresAt" type="date" />
          </Field>
          <Field label="Notes">
            <Input name="notes" placeholder="Optional" />
          </Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Generating..." : "Generate employee ID"}
          </Button>
        </form>

        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-[220px] flex-1">
            <Field label="Search generated cards">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, employee ID, card number, department..."
                  className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </Field>
          </div>
          <p className="text-sm text-slate-500">
            {filteredCards.length} generated card{filteredCards.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Card</th>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Role / Department</th>
                <th className="px-4 py-3 font-medium">School</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No generated employee ID cards yet.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-slate-900">{card.cardNumber}</p>
                      <p className="text-xs text-slate-400">{card.status}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{card.employee.fullName}</p>
                      <p className="font-mono text-xs text-slate-500">{card.employee.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {card.employee.designationTitle ?? "Staff"}
                      <p className="text-xs text-slate-400">{card.employee.departmentName ?? "No department"}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{card.employee.schoolName}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(card.issueDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" size="sm" variant="outline" onClick={() => setSelectedCard(card)}>
                        <Eye className="h-3.5 w-3.5" />
                        View card
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="hr-id-card-no-print absolute inset-0" onClick={() => setSelectedCard(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl">
            <div className="hr-id-card-no-print mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Employee ID card</p>
                <p className="font-mono text-xs text-slate-500">{selectedCard.cardNumber}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button type="button" variant="ghost" onClick={() => setSelectedCard(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="hr-id-card-modal-print">
              <EmployeeIdCard card={selectedCard} showBranch={showBranch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeIdCard({
  card,
  showBranch,
}: {
  card: GeneratedHrEmployeeIdCardRow;
  showBranch: boolean;
}) {
  const e = card.employee;
  const initials = `${e.firstName[0] ?? ""}${e.lastName[0] ?? ""}`;
  return (
    <article className="hr-employee-id-card overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-lg">
      <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-cyan-600 px-5 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-100">
              Employee Identity Card
            </p>
            <h2 className="mt-1 text-lg font-bold leading-tight">{e.schoolName}</h2>
          </div>
          <div className="rounded-xl bg-white/15 p-2">
            <IdCard className="h-6 w-6" />
          </div>
        </div>
        <p className="mt-2 text-xs text-indigo-100">
          {e.schoolAddress ?? e.branchCity}
          {e.schoolPhone ? ` · ${e.schoolPhone}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-[112px_1fr] gap-4 p-5">
        <div>
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 shadow-md ring-1 ring-slate-200">
            {e.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- HR uploads are stored as URLs
              <img src={e.profilePhotoUrl} alt={`${e.fullName} photo`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-slate-400">{initials}</span>
            )}
          </div>
          <p className="mt-3 rounded-lg bg-slate-900 px-2 py-1 text-center font-mono text-xs font-bold text-white">
            {e.employeeCode}
          </p>
          <p className="mt-2 rounded-lg bg-indigo-50 px-2 py-1 text-center font-mono text-[10px] font-bold text-indigo-700">
            {card.cardNumber}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full name</p>
          <h3 className="truncate text-xl font-extrabold text-slate-950">{e.fullName}</h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Info label="Designation" value={e.designationTitle ?? "Staff"} />
            <Info label="Department" value={e.departmentName ?? "—"} />
            <Info label="Employment" value={e.employmentType.replace(/_/g, " ")} />
            <Info label="Status" value={e.status} />
            <Info label="Joining" value={e.joiningDate ? formatDate(e.joiningDate) : "—"} />
            <Info label="Issued" value={formatDate(card.issueDate)} />
            <Info label="Expires" value={card.expiresAt ? formatDate(card.expiresAt) : "—"} />
            {showBranch && <Info label="Branch" value={e.branchCode} />}
          </dl>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
        <dl className="grid gap-3 text-xs sm:grid-cols-2">
          <Info label="Email" value={e.email} />
          <Info label="Phone" value={e.phone ?? "—"} />
        </dl>
        <p className="mt-4 text-[10px] leading-relaxed text-slate-400">
          This card is school property. If found, please return it to the HR office.
        </p>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="truncate font-medium text-slate-800">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}
