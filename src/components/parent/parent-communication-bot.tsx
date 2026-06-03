"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Copy,
  Download,
  Globe2,
  Loader2,
  MessageSquare,
  Pencil,
  RotateCw,
  Send,
  UserRound,
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
import {
  readParentCommunicationBotPrefs,
  resolveInitialChildId,
  writeParentCommunicationBotPrefs,
} from "@/lib/parent-communication-bot-prefs";
import {
  buildDraftPlainText,
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
  downloadDraftTextFile,
  openShareLink,
  parseApiJson,
} from "@/lib/parent-communication-share";

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
  homeroomTeacherName?: string | null;
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

function readUrlChildId() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("childId");
}

export function ParentCommunicationBot({
  apiPath = "/api/parent/communication-bot",
  emptyTitle = "No linked children found",
  emptyDescription = "Link a child account first to generate parent communication drafts.",
  introText = "Choose a child and message type to generate a draft you can copy and send to the school.",
}: {
  apiPath?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  introText?: string;
}) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const prefsHydratedRef = useRef(false);

  const persistPrefs = useCallback(
    (overrides?: Partial<{
      childId: string;
      messageType: ParentCommunicationMessageType;
      language: ParentCommunicationLanguage;
      tone: ParentCommunicationTone;
    }>) => {
      writeParentCommunicationBotPrefs({
        childId: overrides?.childId ?? selectedChildId,
        messageType: overrides?.messageType ?? messageType,
        language: overrides?.language ?? language,
        tone: overrides?.tone ?? tone,
      });
    },
    [language, messageType, selectedChildId, tone]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function loadContext() {
      setLoadingContext(true);
      setError(null);
      setContext(null);

      try {
        const response = await fetch(apiPath, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });

        const data = await parseApiJson<BotContextResponse & { error?: string }>(response);
        if (!response.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "Could not load parent communication assistant."
          );
        }

        if (cancelled) return;

        setContext(data);

        const saved = readParentCommunicationBotPrefs();
        const urlChildId = readUrlChildId();
        const childIds = data.children.map((child) => child.id);
        setSelectedChildId(
          resolveInitialChildId(childIds, {
            urlChildId,
            savedChildId: saved.childId,
            defaultChildId: data.defaultChildId,
          })
        );

        if (!prefsHydratedRef.current) {
          if (saved.messageType) setMessageType(saved.messageType);
          if (saved.language) setLanguage(saved.language);
          if (saved.tone) setTone(saved.tone);
          prefsHydratedRef.current = true;
        }
      } catch (loadError) {
        if (!cancelled) {
          setContext(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load parent communication assistant."
          );
        }
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    }

    void loadContext();
    return () => {
      cancelled = true;
    };
  }, [apiPath, open, pathname, reloadKey]);

  const shareText = useMemo(() => {
    if (!draftResult) return "";
    return buildDraftPlainText(editedSubject, editedBody);
  }, [draftResult, editedSubject, editedBody]);

  const selectedChild = useMemo(
    () => context?.children.find((child) => child.id === selectedChildId) ?? null,
    [context, selectedChildId]
  );

  const previewSubject = editedSubject || draftResult?.draft.subject || "";
  const previewBody = editedBody || draftResult?.draft.body || "";

  function applyDraftResult(data: DraftResponse) {
    setDraftResult(data);
    setEditedSubject(data.draft.subject);
    setEditedBody(data.draft.body);
    setIsEditing(false);
    setCopied(false);
  }

  async function generateDraft() {
    if (!selectedChildId) {
      setError("Select a child first.");
      return;
    }

    setDraftLoading(true);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          childId: selectedChildId,
          messageType,
          language,
          tone,
          additionalNotes,
        }),
      });

      const data = await parseApiJson<DraftResponse & { error?: string }>(response);
      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "Could not generate draft.");
      }

      applyDraftResult(data);
      persistPrefs();
    } catch (draftError) {
      setError(
        draftError instanceof Error ? draftError.message : "Could not generate draft."
      );
    } finally {
      setDraftLoading(false);
    }
  }

  async function copyDraft() {
    if (!draftResult || !shareText) return;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Clipboard access failed. Copy the draft manually.");
    }
  }

  function shareViaWhatsApp() {
    if (!draftResult || !shareText) return;
    openShareLink(buildWhatsAppShareUrl(shareText));
  }

  function shareViaTelegram() {
    if (!draftResult || !shareText) return;
    openShareLink(buildTelegramShareUrl(shareText));
  }

  function saveDraftFile() {
    if (!draftResult) return;
    const base = `${draftResult.summary.studentName}-${messageType}`;
    downloadDraftTextFile(editedSubject, editedBody, base);
  }

  const canGenerate =
    Boolean(selectedChildId) && Boolean(context?.children.length) && !loadingContext && !draftLoading;

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col items-stretch justify-end gap-3",
        "inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      )}
    >
      {open ? (
        <section
          id="parent-message-drafts-panel"
          className={cn(
            "pointer-events-auto flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg",
            "max-h-[calc(100dvh-9rem)] sm:max-h-[min(640px,calc(100dvh-9rem))]",
            "sm:w-[min(100vw-3rem,410px)]"
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold leading-snug text-slate-900">
                  Message drafts
                </h2>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">
                  School updates from your children&apos;s records
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close message drafts"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {loadingContext && !context ? (
              <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-600" />
                <p className="mt-3 text-sm text-slate-600">
                  Loading communication context...
                </p>
              </div>
            ) : !context ? (
              <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-center">
                <p className="text-sm text-red-800">
                  {error ?? "Could not load parent communication assistant."}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setError(null);
                    setReloadKey((key) => key + 1);
                  }}
                >
                  Try again
                </Button>
              </div>
            ) : context.children.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
                <Bot className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-900">{emptyTitle}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {emptyDescription}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  {context?.parentName ? (
                    <>
                      Signed in as <span className="font-medium text-slate-900">{context.parentName}</span>.
                      {introText}
                    </>
                  ) : (
                    <>Choose a child and message type to generate a draft from their latest school records.</>
                  )}
                </p>

                <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <Field label="Child">
                    <Select
                      value={selectedChildId}
                      onChange={(event) => {
                        setSelectedChildId(event.target.value);
                        persistPrefs({ childId: event.target.value });
                      }}
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
                        onChange={(event) => {
                          const value = event.target.value as ParentCommunicationMessageType;
                          setMessageType(value);
                          persistPrefs({ messageType: value });
                        }}
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
                        onChange={(event) => {
                          const value = event.target.value as ParentCommunicationTone;
                          setTone(value);
                          persistPrefs({ tone: value });
                        }}
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
                      onChange={(event) => {
                        const value = event.target.value as ParentCommunicationLanguage;
                        setLanguage(value);
                        persistPrefs({ language: value });
                      }}
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

                  <Button type="button" onClick={() => void generateDraft()} disabled={!canGenerate}>
                    {draftLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Generate draft
                  </Button>
                </div>

                {selectedChild && (
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
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

                    {selectedChild.homeroomTeacherName ? (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-sm text-indigo-900">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                        <p>
                          Suggested contact:{" "}
                          <span className="font-medium">{selectedChild.homeroomTeacherName}</span>
                          <span className="text-indigo-700/80"> (class teacher)</span>
                        </p>
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-500">
                        Contact your branch office if a class teacher is not listed yet.
                      </p>
                    )}

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
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {draftResult.draft.messageTypeLabel}
                        </p>
                        {isEditing ? (
                          <div className="mt-3 space-y-3">
                            <div>
                              <Label htmlFor="draft-subject">Subject</Label>
                              <input
                                id="draft-subject"
                                type="text"
                                value={editedSubject}
                                onChange={(event) => setEditedSubject(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            <div>
                              <Label htmlFor="draft-body">Message</Label>
                              <Textarea
                                id="draft-body"
                                className="mt-1 min-h-40"
                                value={editedBody}
                                onChange={(event) => setEditedBody(event.target.value)}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="mt-3 text-base font-semibold text-slate-900">
                              {previewSubject}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {draftResult.draft.preview}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          <Globe2 className="h-3.5 w-3.5" />
                          {draftResult.draft.languageLabel}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => setIsEditing((current) => !current)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {isEditing ? "Preview" : "Edit"}
                        </Button>
                      </div>
                    </div>

                    {!isEditing ? (
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
                    ) : null}

                    {!isEditing ? (
                      <pre className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {previewBody}
                      </pre>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => void copyDraft()}>
                        {copied ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        onClick={shareViaWhatsApp}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-sky-200 text-sky-800 hover:bg-sky-50"
                        onClick={shareViaTelegram}
                      >
                        Telegram
                      </Button>
                      <Button type="button" variant="outline" onClick={saveDraftFile}>
                        <Download className="h-4 w-4" />
                        Download
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
                          <RotateCw className="h-4 w-4" />
                        )}
                        Regenerate
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
        className="pointer-events-auto ms-auto h-12 shrink-0 rounded-full px-4 shadow-md sm:ms-0"
        aria-expanded={open}
        aria-controls="parent-message-drafts-panel"
      >
        <MessageSquare className="h-4 w-4" />
        Messages
      </Button>
    </div>
  );
}
