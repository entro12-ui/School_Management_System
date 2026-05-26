"use client";

import { useState, useTransition } from "react";
import { HrCandidateStatus, HrJobPostStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { saveHrCandidate, saveHrJobPost } from "@/lib/actions/hr";
import { HrFeedback } from "./hr-feedback";

export function HrRecruitmentManager({
  branchId,
  jobs,
  departments,
  canWrite,
}: {
  branchId: string;
  jobs: {
    id: string;
    title: string;
    status: HrJobPostStatus;
    department: { name: string } | null;
    candidates: {
      id: string;
      fullName: string;
      email: string;
      status: HrCandidateStatus;
      aiScore: number | null;
    }[];
    _count: { candidates: number };
  }[];
  departments: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.success) setMessage(res.message ?? "Saved");
      else setError(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-6">
      <HrFeedback message={message} error={error} />

      {canWrite && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            action={(fd) => run(() => saveHrJobPost(fd))}
          >
            <h2 className="font-semibold">Job post</h2>
            <input type="hidden" name="branchId" value={branchId} />
            <Field label="Title">
              <Input name="title" required />
            </Field>
            <Field label="Department">
              <Select name="departmentId">
                <option value="">—</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Description">
              <Input name="description" />
            </Field>
            <Field label="Closing date">
              <Input name="closingDate" type="date" />
            </Field>
            <Button type="submit" size="sm" disabled={pending}>
              Post job
            </Button>
          </form>

          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            action={(fd) => run(() => saveHrCandidate(fd))}
          >
            <h2 className="font-semibold">Candidate</h2>
            <Field label="Job">
              <Select name="jobPostId" required>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Full name">
              <Input name="fullName" required />
            </Field>
            <Field label="Email">
              <Input name="email" type="email" required />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue="APPLIED">
                {Object.values(HrCandidateStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" size="sm" disabled={pending}>
              Add candidate
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {jobs.map((j) => (
          <article key={j.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold">{j.title}</h3>
              <span className="text-xs text-slate-500">{j.status}</span>
            </div>
            <p className="text-sm text-slate-500">
              {j.department?.name ?? "No dept"} · {j._count.candidates} candidates
            </p>
            <ul className="mt-2 text-sm">
              {j.candidates.map((c) => (
                <li key={c.id} className="text-slate-600">
                  {c.fullName} — {c.status}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
