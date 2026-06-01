"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bot,
  CheckCircle2,
  Copy,
  Globe2,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Label, Select } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import {
  PARENT_COMMUNICATION_LANGUAGE_LABELS,
  PARENT_COMMUNICATION_LANGUAGES,
  PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS,
  PARENT_COMMUNICATION_MESSAGE_TYPES,
  PARENT_COMMUNICATION_TONE_LABELS,
  PARENT_COMMUNICATION_TONES,
  type ParentCommunicationLanguage,
  type ParentCommunicationMessageType,
  type ParentCommunicationTone,
} from "@/lib/parent-communication";

type ChildSummary = {
  id: string;
  studentName: string;
  studentId: string;
  gradeLabel: string;
  className: string;
  branchName: string;
  recentGrades: number;
  averagePercent: number | null;
  latestAssessmentTitle: string | null;
  latestAssessmentSubject: string | null;
  latestAssessmentPercent: number | null;
  strongestSubject: string | null;
  watchSubject: string | null;
  absencesLast30Days: number;
  lateLast30Days: number;
  attendanceRate: number | null;
  outstandingBalance: number;
  pendingFeeItems: number;
};

type Draft = {
  subject: string;
  preview: string;
  body: string;
  highlights: string[];
  language: ParentCommunicationLanguage;
  languageLabel: string;
  messageType: ParentCommunicationMessageType;
  messageTypeLabel: string;
  tone: ParentCommunicationTone;
  source: "rules";
};

type BotContextResponse = {
  parentName: string;
  defaultChildId: string | null;
  children: ChildSummary[];
  stats: {
    multilingualSupport: number;
    workloadReduction: string;
    draftTypes: number;
  };
};

type DraftResponse = {
  parentName: string;
  summary: ChildSummary;
  draft: Draft;
};

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
        className
      )}
      {...props}
    />
  );
}

export function ParentCommunicationBot() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<BotContextResponse | null>(null);
  const [draftResult, setDraftResult] = useState<DraftResponse | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [messageType, setMessageType] =
    useState<ParentCommunicationMessageType>("progress_report");
  const [language, setLanguage] = useState<ParentCommunicationLanguage>("en");
  const [tone, setTone] = useState<ParentCommunicationTone>("warm");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || context || loadingContext) return;

    async function loadContext() {
      setLoadingContext(true);
      setError(null);
      try {
        const response = await fetch("/api/parent/communication-bot", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Could not load parent communication assistant.");
        }

        const data = (await response.json()) as BotContextResponse;
        setContext(data);
        setSelectedChildId((current) => current || data.defaultChildId || data.children[0]?.id || "");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load parent communication assistant."
        );
      } finally {
        setLoadingContext(false);
      }
    }

    void loadContext();
  }, [open, context, loadingContext]);

  const selectedChild = useMemo(
    () => context?.children.find((child) => child.id === selectedChildId) ?? null,
    [context, selectedChildId]
  );

  async function generateDraft() {
    if (!selectedChildId) {
      setError("Select a child first.");
      return;
    }

    setDraftLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/parent/communication-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: selectedChildId,
          messageType,
          language,
          tone,
          additionalNotes,
        }),
      });

      const data = (await response.json()) as DraftResponse | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "Could not generate draft.");
      }

      setDraftResult(data as DraftResponse);
    } catch (draftError) {
      setError(
        draftError instanceof Error ? draftError.message : "Could not generate draft."
      );
    } finally {
      setDraftLoading(false);
    }
  }

  async function copyDraft() {
    if (!draftResult) return;
    const text = `${draftResult.draft.subject}\n\n${draftResult.draft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access failed. Copy the draft manually.");
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-30 sm:bottom-6 sm:right-6">
      {open ? (
        <section className="pointer-events-auto w-[calc(100vw-1.5rem)] max-w-[410px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3.5 w-3.5" />
                  Parent Communication Bot
                </div>
                <h2 className="mt-3 text-lg font-semibold">
                  Auto-draft progress reports & alerts
                </h2>
                <p className="mt-1 text-sm text-indigo-100">
                  Personalized, multilingual parent messages with less admin effort.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close parent communication bot"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                Multilingual support
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">
                Personalized at scale
              </span>
              <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-emerald-50">
                Reduces admin workload by {context?.stats.workloadReduction ?? "~40%"}
              </span>
            </div>
          </div>

          <div className="max-h-[72vh] overflow-y-auto bg-slate-50 p-4">
            {loadingContext ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-indigo-600" />
                <p className="mt-3 text-sm text-slate-600">
                  Loading communication context...
                </p>
              </div>
            ) : context?.children.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center">
                <Bot className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-900">No linked children found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Link a child account first to generate parent communication drafts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-indigo-100 p-2 text-indigo-700">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Hello {context?.parentName || "there"}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        I can draft polished progress updates, attendance alerts, fee reminders,
                        and positive notes using your child&apos;s latest records.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <Field label="Child">
                    <Select
                      value={selectedChildId}
                      onChange={(event) => setSelectedChildId(event.target.value)}
                    >
                      {context?.children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.studentName} · {child.gradeLabel}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Draft type">
                      <Select
                        value={messageType}
                        onChange={(event) =>
                          setMessageType(event.target.value as ParentCommunicationMessageType)
                        }
                      >
                        {PARENT_COMMUNICATION_MESSAGE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Tone">
                      <Select
                        value={tone}
                        onChange={(event) =>
                          setTone(event.target.value as ParentCommunicationTone)
                        }
                      >
                        {PARENT_COMMUNICATION_TONES.map((option) => (
                          <option key={option} value={option}>
                            {PARENT_COMMUNICATION_TONE_LABELS[option]}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  <Field label="Language">
                    <Select
                      value={language}
                      onChange={(event) =>
                        setLanguage(event.target.value as ParentCommunicationLanguage)
                      }
                    >
                      {PARENT_COMMUNICATION_LANGUAGES.map((option) => (
                        <option key={option} value={option}>
                          {PARENT_COMMUNICATION_LANGUAGE_LABELS[option]}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div>
                    <Label htmlFor="parent-bot-notes">Extra context (optional)</Label>
                    <Textarea
                      id="parent-bot-notes"
                      className="mt-1 min-h-24"
                      maxLength={300}
                      value={additionalNotes}
                      onChange={(event) => setAdditionalNotes(event.target.value)}
                      placeholder="Add a custom note, next step, or something you want the message to mention."
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      {additionalNotes.length}/300 characters
                    </p>
                  </div>

                  <Button type="button" onClick={() => void generateDraft()} disabled={draftLoading}>
                    {draftLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Generate draft
                  </Button>
                </div>

                {selectedChild && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{selectedChild.studentName}</p>
                        <p className="text-sm text-slate-500">
                          {selectedChild.gradeLabel} · {selectedChild.className} ·{" "}
                          {selectedChild.branchName}
                        </p>
                      </div>
                      <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {selectedChild.studentId}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Academic
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {selectedChild.averagePercent != null
                            ? `${selectedChild.averagePercent}% average across ${selectedChild.recentGrades} recent grade entries`
                            : "No recent grade average yet"}
                        </p>
                        {selectedChild.strongestSubject ? (
                          <p className="mt-1 text-xs text-slate-500">
                            Strongest subject: {selectedChild.strongestSubject}
                          </p>
                        ) : null}
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          Attendance
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {selectedChild.attendanceRate != null
                            ? `${selectedChild.attendanceRate}% attendance in the last 30 days`
                            : "No recent attendance data"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedChild.absencesLast30Days} absence(s),{" "}
                          {selectedChild.lateLast30Days} late arrival(s)
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Fees</p>
                        <p className="mt-1 text-sm text-slate-700">
                          {formatCurrency(selectedChild.outstandingBalance)} outstanding
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {selectedChild.pendingFeeItems} pending item(s)
                        </p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Latest</p>
                        <p className="mt-1 text-sm text-slate-700">
                          {selectedChild.latestAssessmentTitle
                            ? selectedChild.latestAssessmentTitle
                            : "Latest assessment not yet available"}
                        </p>
                        {selectedChild.latestAssessmentPercent != null ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {selectedChild.latestAssessmentSubject} ·{" "}
                            {selectedChild.latestAssessmentPercent}%
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {error ? (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {error}
                  </div>
                ) : null}

                {draftResult ? (
                  <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {draftResult.draft.messageTypeLabel}
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-slate-900">
                          {draftResult.draft.subject}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {draftResult.draft.preview}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          <Globe2 className="h-3.5 w-3.5" />
                          {draftResult.draft.languageLabel}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {draftResult.draft.highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>

                    <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {draftResult.draft.body}
                    </pre>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => void copyDraft()}>
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied" : "Copy draft"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void generateDraft()}
                        disabled={draftLoading}
                      >
                        {draftLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Refresh draft
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <Button
        type="button"
        size="lg"
        onClick={() => setOpen((current) => !current)}
        className="pointer-events-auto h-14 rounded-full px-5 shadow-xl shadow-indigo-300/40"
      >
        <Bell className="h-5 w-5" />
        Parent Bot
      </Button>
    </div>
  );
}
