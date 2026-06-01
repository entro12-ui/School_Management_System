"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Languages,
  Loader2,
  MessageCircleQuestion,
  PenLine,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Timer,
  UploadCloud,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import {
  TUTOR_KNOWLEDGE_MODE_OPTIONS,
  type TutorKnowledgeMode,
} from "@/lib/ai/knowledge-mode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TutorMode = "tutor" | "quiz" | "writing" | "exam";

type AiStudyTutorProps = {
  studentName: string;
  gradeLevel: number;
  stream?: string | null;
  schoolName: string;
  className?: string | null;
};

type ChatMessage = {
  id: number;
  role: "student" | "tutor";
  text: string;
};

type QuizQuestion = {
  id: number;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  pageReference: number;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
};

type Chapter = {
  gradeLevel: number;
  number: number;
  title: string;
  subject: string;
  pageStart: number;
  pageEnd: number;
  nextChapter: number;
  chunks: string[];
  keywords: string[];
};

type UploadedTextbook = {
  name: string;
  size: number;
  type: string;
};

const gradeOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const languageOptions = [
  "English",
  "Amharic",
  "Oromigna / Afaan Oromo",
  "Tigregna / Tigrigna",
  "Somali",
  "Afar",
  "Sidama",
];

const subjectsByGrade: Record<number, string[]> = {
  1: ["Mathematics", "Environmental Science", "English", "Amharic"],
  2: ["Mathematics", "Environmental Science", "English", "Amharic"],
  3: ["Mathematics", "Environmental Science", "English", "Afaan Oromo"],
  4: ["Mathematics", "Science", "English", "Amharic"],
  5: ["Mathematics", "Science", "English", "Social Studies"],
  6: ["Mathematics", "Science", "English", "Social Studies"],
  7: ["Mathematics", "Biology", "English", "Civics"],
  8: ["Mathematics", "Physics", "English", "Geography"],
  9: ["Mathematics", "Biology", "Chemistry", "English"],
  10: ["Mathematics", "Physics", "Chemistry", "English"],
  11: ["Mathematics", "Physics", "Biology", "Economics"],
  12: ["Mathematics", "Physics", "Chemistry", "History"],
};

function getSubjectsForGrade(grade: number) {
  return subjectsByGrade[grade] ?? subjectsByGrade[1];
}

function buildChapterCatalog(): Chapter[] {
  return gradeOptions.flatMap((grade) =>
    getSubjectsForGrade(grade).flatMap((subject, subjectIndex) => {
      const pageBase = 12 + subjectIndex * 26;
      const chapterTitle =
        subject === "Mathematics"
          ? "Numbers and problem solving"
          : subject === "Science" || subject === "Environmental Science"
            ? "Living things and the environment"
            : subject === "English"
              ? "Reading for main ideas"
              : `${subject} foundations`;

      return [
        {
          gradeLevel: grade,
          number: 1,
          title: chapterTitle,
          subject,
          pageStart: pageBase,
          pageEnd: pageBase + 11,
          nextChapter: 2,
          chunks: [
            `Page ${pageBase}: This chapter introduces the key ideas for Grade ${grade} ${subject}.`,
            `Page ${pageBase + 4}: The textbook gives examples students should use before answering exercises.`,
            `Page ${pageBase + 9}: The review section connects the chapter ideas to practice questions.`,
          ],
          keywords: [
            subject.toLowerCase(),
            "chapter",
            "example",
            "practice",
            "review",
            "question",
            "problem",
            "idea",
          ],
        },
        {
          gradeLevel: grade,
          number: 2,
          title:
            subject === "Mathematics"
              ? "Fractions as parts of a whole"
              : subject === "Science"
                ? "Plants and their parts"
                : `${subject} chapter practice`,
          subject,
          pageStart: pageBase + 12,
          pageEnd: pageBase + 23,
          nextChapter: 3,
          chunks:
            subject === "Mathematics"
              ? [
                  `Page ${pageBase + 12}: A fraction shows equal parts of a whole. The denominator tells how many equal parts the whole has.`,
                  `Page ${pageBase + 13}: The numerator tells how many equal parts are selected or shaded.`,
                  `Page ${pageBase + 17}: To compare fractions with the same denominator, compare their numerators.`,
                ]
              : subject === "Science"
                ? [
                    `Page ${pageBase + 12}: Roots hold the plant in the soil and take in water.`,
                    `Page ${pageBase + 15}: The stem supports the plant and carries water to the leaves.`,
                    `Page ${pageBase + 18}: Leaves help the plant make its food using sunlight.`,
                  ]
                : [
                    `Page ${pageBase + 12}: This chapter develops the main Grade ${grade} ${subject} skill.`,
                    `Page ${pageBase + 16}: Worked examples show how to apply the chapter idea.`,
                    `Page ${pageBase + 21}: The practice section checks understanding step by step.`,
                  ],
          keywords:
            subject === "Mathematics"
              ? ["fraction", "fractions", "numerator", "denominator", "equal", "parts", "compare", "whole"]
              : subject === "Science"
                ? ["plant", "plants", "root", "roots", "stem", "stems", "leaf", "leaves", "water", "sunlight"]
                : [subject.toLowerCase(), "chapter", "practice", "example", "skill", "understanding"],
        },
      ];
    })
  );
}

const chapters = buildChapterCatalog();

const modes: Array<{
  id: TutorMode;
  label: string;
  description: string;
  icon: typeof BrainCircuit;
}> = [
  {
    id: "tutor",
    label: "Socratic tutor",
    description: "Ask questions and get guided hints.",
    icon: MessageCircleQuestion,
  },
  {
    id: "quiz",
    label: "Practice quiz",
    description: "Adaptive questions with instant feedback.",
    icon: ClipboardCheck,
  },
  {
    id: "writing",
    label: "Writing feedback",
    description: "Improve written answers without rewriting them.",
    icon: PenLine,
  },
  {
    id: "exam",
    label: "Exam prep",
    description: "Grade 11-12 EUEE focused practice.",
    icon: Target,
  },
];

function formatGrade(gradeLevel: number) {
  return gradeLevel === 0 ? "KG" : `Grade ${gradeLevel}`;
}

function formatStream(stream?: string | null) {
  if (!stream) return "N/A";
  return stream
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

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

function buildQuizQuestions(chapter: Chapter): QuizQuestion[] {
  const firstPage = chapter.pageStart;
  const secondPage = chapter.pageStart + 1;
  const thirdPage = Math.min(chapter.pageStart + 5, chapter.pageEnd);

  if (chapter.subject === "Science") {
    return [
      {
        id: 1,
        type: "multiple_choice",
        question: "According to the chapter, what do roots do for a plant?",
        options: ["A. Make food", "B. Hold the plant in soil", "C. Carry pollen"],
        correctAnswer: "B",
        explanation: `Page ${firstPage} says roots hold the plant in the soil and take in water.`,
        pageReference: firstPage,
        difficulty: "easy",
        topic: "Roots",
      },
      {
        id: 2,
        type: "true_false",
        question: "The stem supports the plant and carries water to the leaves.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: `Page ${secondPage} explains that the stem supports the plant and carries water.`,
        pageReference: secondPage,
        difficulty: "easy",
        topic: "Stem",
      },
      {
        id: 3,
        type: "fill_blank",
        question: "Leaves help the plant make food using ____.",
        correctAnswer: "sunlight",
        explanation: `Page ${thirdPage} says leaves help the plant make its food using sunlight.`,
        pageReference: thirdPage,
        difficulty: "medium",
        topic: "Leaves",
      },
    ];
  }

  if (chapter.subject === "English") {
    return [
      {
        id: 1,
        type: "multiple_choice",
        question: "What does the main idea tell you?",
        options: ["A. What a paragraph is mostly about", "B. The page number", "C. Every small detail"],
        correctAnswer: "A",
        explanation: `Page ${firstPage} says the main idea tells what a paragraph is mostly about.`,
        pageReference: firstPage,
        difficulty: "easy",
        topic: "Main idea",
      },
      {
        id: 2,
        type: "true_false",
        question: "Supporting details give more information about the main idea.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: `Page ${secondPage} says supporting details give more information about the main idea.`,
        pageReference: secondPage,
        difficulty: "easy",
        topic: "Supporting details",
      },
      {
        id: 3,
        type: "fill_blank",
        question: "A good summary keeps the main idea and the most important ____.",
        correctAnswer: "details",
        explanation: `Page ${thirdPage} explains that a good summary keeps the main idea and the most important details.`,
        pageReference: thirdPage,
        difficulty: "medium",
        topic: "Summary",
      },
    ];
  }

  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "In the chapter example, what does the denominator tell you?",
      options: ["A. The selected parts", "B. The total equal parts", "C. The page number"],
      correctAnswer: "B",
      explanation: `As the book explains on page ${firstPage}, the denominator tells how many equal parts the whole has.`,
      pageReference: firstPage,
      difficulty: "easy",
      topic: "Denominator",
    },
    {
      id: 2,
      type: "true_false",
      question: "The numerator tells how many equal parts are selected or shaded.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Page ${secondPage} says the numerator tells how many equal parts are selected or shaded.`,
      pageReference: secondPage,
      difficulty: "easy",
      topic: "Numerator",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "To compare fractions with the same denominator, compare their ____.",
      correctAnswer: "numerators",
      explanation: `Page ${thirdPage} explains that fractions with the same denominator are compared using their numerators.`,
      pageReference: thirdPage,
      difficulty: "medium",
      topic: "Comparing fractions",
    },
  ];
}

type TutorEngineStatus = "checking" | "ollama" | "offline" | "mock";

const TUTOR_INTRO_MESSAGES: Record<TutorKnowledgeMode, string> = {
  rag: "Hi. Ask me about the current chapter. I will use your textbook knowledge (RAG) and guide you with questions instead of giving away homework answers.",
  general:
    "Hi. General tutor mode is on — I will help using grade-level subject knowledge without citing textbook pages. Ask your question when you are ready.",
};

export function AiStudyTutor({
  studentName,
  gradeLevel,
  stream,
  schoolName,
  className,
}: AiStudyTutorProps) {
  const [activeMode, setActiveMode] = useState<TutorMode>("tutor");
  const [selectedGrade, setSelectedGrade] = useState(() =>
    Math.min(12, Math.max(1, gradeLevel || 1))
  );
  const [selectedSubject, setSelectedSubject] = useState(() =>
    getSubjectsForGrade(Math.min(12, Math.max(1, gradeLevel || 1)))[0]
  );
  const [chapterIndex, setChapterIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [uploadedTextbooks, setUploadedTextbooks] = useState<UploadedTextbook[]>([]);
  const [question, setQuestion] = useState("");
  const [knowledgeSourceMode, setKnowledgeSourceMode] = useState<TutorKnowledgeMode>("rag");
  const [retrievedPassages, setRetrievedPassages] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "tutor",
      text: TUTOR_INTRO_MESSAGES.rag,
    },
  ]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [essay, setEssay] = useState("");
  const [timedPractice, setTimedPractice] = useState(false);
  const [isTutorLoading, setIsTutorLoading] = useState(false);
  const [tutorEngineStatus, setTutorEngineStatus] = useState<TutorEngineStatus>("checking");
  const [tutorEngineDetail, setTutorEngineDetail] = useState<string | null>(null);

  const subjectOptions = getSubjectsForGrade(selectedGrade);
  const subject = subjectOptions.includes(selectedSubject) ? selectedSubject : subjectOptions[0];
  const chapterOptions = chapters.filter(
    (chapterOption) =>
      chapterOption.gradeLevel === selectedGrade && chapterOption.subject === subject
  );
  const chapter = chapterOptions[chapterIndex] ?? chapterOptions[0];
  const gradeLabel = formatGrade(gradeLevel);
  const streamLabel = formatStream(stream);
  const selectedGradeLabel = formatGrade(selectedGrade);
  const isExamPrepEligible = selectedGrade >= 11;
  const currentQuizQuestions = useMemo(() => buildQuizQuestions(chapter), [chapter]);
  const isRagMode = knowledgeSourceMode === "rag";
  const sidebarPassages = isRagMode
    ? retrievedPassages.length > 0
      ? retrievedPassages
      : chapter.chunks
    : [];
  const knowledgeModeMeta = TUTOR_KNOWLEDGE_MODE_OPTIONS.find(
    (option) => option.value === knowledgeSourceMode
  );

  useEffect(() => {
    setRetrievedPassages([]);
  }, [selectedGrade, selectedSubject, chapterIndex]);

  function handleKnowledgeModeChange(nextMode: TutorKnowledgeMode) {
    if (nextMode === knowledgeSourceMode) return;
    setKnowledgeSourceMode(nextMode);
    setRetrievedPassages([]);
    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        role: "tutor",
        text:
          nextMode === "rag"
            ? "Switched to textbook (RAG) mode. I will ground answers in your chapter and uploaded books."
            : "Switched to general tutor mode. I will not cite textbook pages unless you share them in your question.",
      },
    ]);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadTutorStatus() {
      try {
        const response = await fetch("/api/student/ai-tutor/status");
        if (!response.ok) {
          if (!cancelled) {
            setTutorEngineStatus("offline");
            setTutorEngineDetail("Could not reach the AI tutor service.");
          }
          return;
        }

        const data = (await response.json()) as {
          enabled?: boolean;
          reachable?: boolean;
          model?: string;
          modelInstalled?: boolean;
          error?: string;
        };

        if (cancelled) return;

        if (!data.enabled) {
          setTutorEngineStatus("offline");
          setTutorEngineDetail("AI Tutor is disabled on this server.");
          return;
        }

        if (data.reachable && data.modelInstalled !== false) {
          setTutorEngineStatus("ollama");
          setTutorEngineDetail(data.model ? `Model: ${data.model}` : null);
          return;
        }

        setTutorEngineStatus("mock");
        if (!data.reachable) {
          setTutorEngineDetail(
            data.error
              ? `Ollama offline — using guided fallback. (${data.error})`
              : "Ollama offline — using guided fallback until the model is available."
          );
        } else {
          setTutorEngineDetail(
            data.model
              ? `Pull "${data.model}" on the Ollama host — using guided fallback for now.`
              : "Model not installed — using guided fallback."
          );
        }
      } catch {
        if (!cancelled) {
          setTutorEngineStatus("offline");
          setTutorEngineDetail("Could not check AI tutor status.");
        }
      }
    }

    void loadTutorStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  const score = useMemo(() => {
    return currentQuizQuestions.reduce((total, quizQuestion) => {
      const answer = answers[quizQuestion.id]?.trim().toLowerCase();
      if (!answer) return total;
      return answer === quizQuestion.correctAnswer.toLowerCase() ? total + 1 : total;
    }, 0);
  }, [answers, currentQuizQuestions]);

  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  const essayFeedback = useMemo(() => {
    if (wordCount < 15) return null;

    const firstWords = essay.trim().split(/\s+/).slice(0, 5).join(" ");
    return {
      strength: `You have a clear starting idea in "${firstWords}".`,
      issue: "Add stronger evidence from the assignment or textbook.",
      suggestion:
        "Choose one sentence where you make a claim, then add the page, example, or detail that proves it.",
      improvedExample:
        "This point is stronger because the textbook example shows the same idea in a clear situation.",
    };
  }, [essay, wordCount]);

  async function sendQuestion() {
    const trimmed = question.trim();
    if (!trimmed || isTutorLoading) return;

    const studentMessage: ChatMessage = {
      id: Date.now(),
      role: "student",
      text: trimmed,
    };
    const pendingId = Date.now() + 1;

    setMessages((current) => [...current, studentMessage]);
    setQuestion("");
    setIsTutorLoading(true);

    const history = [...messages, studentMessage].map((entry) => ({
      role: entry.role,
      text: entry.text,
    }));

    setMessages((current) => [
      ...current,
      { id: pendingId, role: "tutor", text: "" },
    ]);

    try {
      const response = await fetch("/api/student/ai-tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: history.slice(-4),
          knowledgeMode: knowledgeSourceMode,
          ragSnippets: [],
          session: {
            studentName,
            schoolName,
            className,
            stream,
            chapter: {
              gradeLevel: selectedGrade,
              subject: chapter.subject,
              chapterNumber: chapter.number,
              chapterTitle: chapter.title,
              pageStart: chapter.pageStart,
              pageEnd: chapter.pageEnd,
              language: selectedLanguage,
              chunks: chapter.chunks,
              keywords: chapter.keywords,
              nextChapter: chapter.nextChapter,
            },
          },
        }),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => ({}))) as {
          detail?: string;
          error?: string;
        };
        throw new Error(err.detail ?? err.error ?? "AI tutor request failed");
      }

      if (!response.body) {
        throw new Error("No response stream from AI tutor");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedReply = "";
      let donePayload: {
        reply: string;
        source: "ollama" | "mock";
        knowledgeMode?: TutorKnowledgeMode;
        retrievedPassages?: string[];
        fallbackReason?: string;
      } | null = null;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as {
            type: string;
            text?: string;
            reply?: string;
            source?: "ollama" | "mock";
            knowledgeMode?: TutorKnowledgeMode;
            retrievedPassages?: string[];
            fallbackReason?: string;
            message?: string;
            detail?: string;
          };

          if (event.type === "meta" && event.retrievedPassages?.length) {
            setRetrievedPassages(event.retrievedPassages);
          }

          if (event.type === "token" && event.text) {
            streamedReply += event.text;
            const snapshot = streamedReply;
            setMessages((current) =>
              current.map((entry) =>
                entry.id === pendingId ? { ...entry, text: snapshot } : entry
              )
            );
          }

          if (event.type === "done" && event.reply) {
            donePayload = {
              reply: event.reply,
              source: event.source ?? "ollama",
              knowledgeMode: event.knowledgeMode,
              retrievedPassages: event.retrievedPassages,
              fallbackReason: event.fallbackReason,
            };
          }

          if (event.type === "error") {
            throw new Error(event.detail ?? event.message ?? "AI tutor request failed");
          }
        }
      }

      if (!donePayload?.reply) {
        throw new Error("AI tutor returned an empty reply");
      }

      const finalReply = donePayload.reply;
      setMessages((current) =>
        current.map((entry) =>
          entry.id === pendingId ? { ...entry, text: finalReply } : entry
        )
      );

      if (donePayload.knowledgeMode === "rag" && donePayload.retrievedPassages?.length) {
        setRetrievedPassages(donePayload.retrievedPassages);
      }

      if (donePayload.source === "ollama") {
        setTutorEngineStatus("ollama");
        setTutorEngineDetail(null);
      } else if (donePayload.source === "mock") {
        setTutorEngineStatus("mock");
        setTutorEngineDetail(
          donePayload.fallbackReason
            ? `Ollama timed out or offline — fallback reply. (${donePayload.fallbackReason})`
            : "Using guided fallback replies."
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setMessages((current) => {
        const withoutEmpty = current.filter(
          (entry) => !(entry.id === pendingId && entry.text === "")
        );
        return [
          ...withoutEmpty,
          {
            id: pendingId,
            role: "tutor",
            text: `I could not reach the AI tutor right now. ${message} Try again in a moment, or ask your teacher for help.`,
          },
        ];
      });
      setTutorEngineStatus("offline");
      setTutorEngineDetail(message);
    } finally {
      setIsTutorLoading(false);
    }
  }

  function resetQuiz() {
    setAnswers({});
    setQuizSubmitted(false);
  }

  function handleTextbookUpload(files: FileList | null) {
    if (!files) return;

    setUploadedTextbooks((current) => [
      ...current,
      ...Array.from(files).map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type || "Unknown type",
      })),
    ]);
  }

  return (
    <section id="ai-study-tutor" className="mb-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI Study Tutor
          </div>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Study smarter with guided help</h2>
          <p className="mt-1 text-sm text-slate-500">
            Personalized for {studentName}, {gradeLabel}
            {className ? `, ${className}` : ""} at {schoolName}.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
          <p className="font-medium text-slate-900">Tutor engine</p>
          <p className="text-slate-500">
            {tutorEngineStatus === "checking" && "Checking Ollama connection…"}
            {tutorEngineStatus === "ollama" && "Ollama connected — live Socratic tutoring."}
            {tutorEngineStatus === "mock" && "Offline fallback — guided replies until Ollama is ready."}
            {tutorEngineStatus === "offline" && "AI tutor unavailable — check server configuration."}
          </p>
          {tutorEngineDetail ? (
            <p className="mt-1 text-xs text-amber-700">{tutorEngineDetail}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-indigo-600" />
                Study modes
              </CardTitle>
              <CardDescription>Choose how you want help today.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {modes.map((mode) => {
                const Icon = mode.icon;
                const active = activeMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setActiveMode(mode.id)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition",
                      active
                        ? "border-indigo-200 bg-indigo-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-indigo-100 hover:bg-slate-50"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg",
                          active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{mode.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{mode.description}</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className={cn(!isRagMode && "opacity-75")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-indigo-600" />
                Textbooks
              </CardTitle>
              <CardDescription>
                {isRagMode
                  ? "Upload books for RAG study support."
                  : "Uploads apply in textbook (RAG) mode only."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label
                className={cn(
                  "flex flex-col items-center rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 px-4 py-5 text-center transition",
                  isRagMode
                    ? "cursor-pointer hover:bg-indigo-50"
                    : "cursor-not-allowed"
                )}
              >
                <UploadCloud className="h-7 w-7 text-indigo-600" />
                <span className="mt-2 text-sm font-medium text-indigo-800">Upload textbook files</span>
                <span className="mt-1 text-xs text-indigo-600">PDF, DOCX, TXT, or images</span>
                <input
                  type="file"
                  multiple
                  disabled={!isRagMode}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  className="sr-only"
                  onChange={(event) => handleTextbookUpload(event.target.files)}
                />
              </label>

              {uploadedTextbooks.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {uploadedTextbooks.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="rounded-lg border border-slate-200 bg-white p-2 text-xs"
                    >
                      <p className="truncate font-medium text-slate-800">{file.name}</p>
                      <p className="mt-0.5 text-slate-500">{formatFileSize(file.size)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Uploaded textbooks will be attached to the selected grade, subject, chapter, and language.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-slate-50 p-5">
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-6">
              <div className="lg:col-span-2 xl:col-span-6">
                <p className="text-sm font-semibold text-slate-900">
                  Chapter {chapter.number}: {chapter.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedGradeLabel} - {chapter.subject} pages {chapter.pageStart}-{chapter.pageEnd} - {selectedLanguage} - Stream: {streamLabel}
                  {knowledgeModeMeta ? ` - ${knowledgeModeMeta.shortLabel}` : ""}
                </p>
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select
                  id="grade"
                  className="mt-1 bg-white"
                  value={String(selectedGrade)}
                  onChange={(event) => {
                    const nextGrade = Number(event.target.value);
                    setSelectedGrade(nextGrade);
                    setSelectedSubject(getSubjectsForGrade(nextGrade)[0]);
                    setChapterIndex(0);
                    resetQuiz();
                  }}
                >
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select
                  id="subject"
                  className="mt-1 bg-white"
                  value={subject}
                  onChange={(event) => {
                    setSelectedSubject(event.target.value);
                    setChapterIndex(0);
                    resetQuiz();
                  }}
                >
                  {subjectOptions.map((subjectOption) => (
                    <option key={subjectOption} value={subjectOption}>
                      {subjectOption}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="chapter">Chapter</Label>
                <Select
                  id="chapter"
                  className="mt-1 bg-white"
                  value={String(chapterIndex)}
                  onChange={(event) => {
                    setChapterIndex(Number(event.target.value));
                    resetQuiz();
                  }}
                >
                  {chapterOptions.map((chapterOption, index) => (
                    <option key={`${chapterOption.subject}-${chapterOption.number}`} value={index}>
                      Ch. {chapterOption.number} - p. {chapterOption.pageStart}-{chapterOption.pageEnd}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="language" className="inline-flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  Language
                </Label>
                <Select
                  id="language"
                  className="mt-1 bg-white"
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value)}
                >
                  {languageOptions.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="knowledge-source" className="inline-flex items-center gap-1">
                  {isRagMode ? (
                    <BookOpen className="h-3.5 w-3.5" />
                  ) : (
                    <GraduationCap className="h-3.5 w-3.5" />
                  )}
                  Knowledge source
                </Label>
                <Select
                  id="knowledge-source"
                  className="mt-1 bg-white"
                  value={knowledgeSourceMode}
                  onChange={(event) =>
                    handleKnowledgeModeChange(event.target.value as TutorKnowledgeMode)
                  }
                >
                  {TUTOR_KNOWLEDGE_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {knowledgeModeMeta?.description}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg border p-3 text-xs lg:col-span-2 xl:col-span-6",
                  isRagMode
                    ? "border-indigo-100 bg-white text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600"
                )}
              >
                <p className="font-semibold">Prompt guardrails active</p>
                <p>
                  {isRagMode
                    ? "Textbook RAG: retrieved passages only, cite pages, Socratic hints, check-in question."
                    : "General mode: grade-level subject knowledge, no invented textbook pages, Socratic hints."}
                </p>
              </div>
            </div>
          </div>

          {activeMode === "tutor" && (
            <div
              className={cn(
                "grid min-h-[480px] gap-0",
                isRagMode ? "lg:grid-cols-[minmax(0,1fr)_280px]" : "lg:grid-cols-1"
              )}
            >
              <div className="flex min-h-[480px] flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "student" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "tutor" && (
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                          <Bot className="h-4 w-4" />
                        </span>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm",
                          message.role === "student"
                            ? "bg-indigo-600 text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        )}
                      >
                        {message.text}
                      </div>
                    </div>
                  ))}
                  {isTutorLoading &&
                  messages.at(-1)?.role === "tutor" &&
                  !messages.at(-1)?.text ? (
                    <div className="flex gap-3">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Bot className="h-4 w-4" />
                      </span>
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        Thinking…
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="border-t border-slate-100 bg-white p-4">
                  <div className="flex gap-2">
                    <Input
                      value={question}
                      disabled={isTutorLoading}
                      onChange={(event) => setQuestion(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void sendQuestion();
                      }}
                      placeholder={
                        isRagMode
                          ? "Ask about the chapter, for example: I don't understand denominators"
                          : "Ask a general question, for example: How do I compare fractions?"
                      }
                    />
                    <Button type="button" onClick={() => void sendQuestion()} disabled={isTutorLoading}>
                      {isTutorLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Ask
                    </Button>
                  </div>
                </div>
              </div>

              {isRagMode ? (
                <aside className="border-t border-slate-100 bg-slate-50 p-5 lg:border-l lg:border-t-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <BookMarked className="h-4 w-4 text-indigo-600" />
                      {retrievedPassages.length > 0 ? "Retrieved for your question" : "Chapter context"}
                    </div>
                    {retrievedPassages.length > 0 ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                        RAG
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Passages ranked by relevance to your latest question.
                  </p>
                  <div className="mt-3 space-y-3">
                    {sidebarPassages.map((chunk) => (
                      <p
                        key={chunk}
                        className="rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600"
                      >
                        {chunk}
                      </p>
                    ))}
                  </div>
                </aside>
              ) : null}
            </div>
          )}

          {activeMode === "quiz" && (
            <div className="p-5">
              <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Adaptive practice quiz</p>
                  <p className="text-sm text-slate-500">Questions are weighted toward weak topics and cite textbook pages.</p>
                </div>
                <Button type="button" variant="outline" onClick={resetQuiz}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </div>

              <div className="space-y-4">
                {currentQuizQuestions.map((quizQuestion) => {
                  const selected = answers[quizQuestion.id] ?? "";
                  const isCorrect =
                    selected.trim().toLowerCase() === quizQuestion.correctAnswer.toLowerCase();

                  return (
                    <article key={quizQuestion.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {quizQuestion.id}. {quizQuestion.question}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Page {quizQuestion.pageReference} - {quizQuestion.topic} - {quizQuestion.difficulty}
                          </p>
                        </div>
                        {quizSubmitted && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                              isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                            )}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isCorrect ? "Correct" : "Review"}
                          </span>
                        )}
                      </div>

                      {quizQuestion.type === "fill_blank" ? (
                        <Input
                          className="mt-3"
                          value={selected}
                          onChange={(event) =>
                            setAnswers((current) => ({
                              ...current,
                              [quizQuestion.id]: event.target.value,
                            }))
                          }
                          placeholder="Type your answer"
                        />
                      ) : (
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {quizQuestion.options?.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAnswers((current) => ({
                                  ...current,
                                  [quizQuestion.id]: option.startsWith("A.")
                                    ? "A"
                                    : option.startsWith("B.")
                                      ? "B"
                                      : option.startsWith("C.")
                                        ? "C"
                                        : option,
                                }))
                              }
                              className={cn(
                                "rounded-lg border px-3 py-2 text-left text-sm transition",
                                selected && option.startsWith(selected)
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                                  : selected === option
                                    ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                                    : "border-slate-200 hover:bg-slate-50"
                              )}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}

                      {quizSubmitted && (
                        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                          {quizQuestion.explanation}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" onClick={() => setQuizSubmitted(true)}>
                  Submit quiz
                </Button>
                {quizSubmitted && (
                  <p className="text-sm font-medium text-slate-700">
                    Score: {score} / {currentQuizQuestions.length}. Keep reviewing {chapter.title.toLowerCase()}.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeMode === "writing" && (
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <Label htmlFor="essay">Paste your written answer</Label>
                <Textarea
                  id="essay"
                  className="mt-2 min-h-64"
                  value={essay}
                  onChange={(event) => setEssay(event.target.value)}
                  placeholder="Paste your paragraph or essay here. The tutor will give one strength and up to three focused suggestions."
                />
                <p className="mt-2 text-xs text-slate-500">
                  Word count: {wordCount}. Scores stay with the teacher grading tool.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">Feedback preview</p>
                {essayFeedback ? (
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Strength</p>
                      <p className="mt-1 text-slate-700">{essayFeedback.strength}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Improve</p>
                      <p className="mt-1 text-slate-700">{essayFeedback.issue}</p>
                      <p className="mt-2 text-slate-500">{essayFeedback.suggestion}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-3 text-indigo-800">
                      {essayFeedback.improvedExample}
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    Add at least 15 words to receive focused feedback.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeMode === "exam" && (
            <div className="p-5">
              {isExamPrepEligible ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="rounded-xl border border-slate-200 p-5">
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-indigo-600" />
                      <h3 className="font-semibold text-slate-900">EUEE practice mode</h3>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      This connects explanations to syllabus topics and tracks confidence during the session.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTimedPractice((current) => !current)}
                      className={cn(
                        "mt-5 rounded-lg border px-4 py-2 text-sm font-medium transition",
                        timedPractice
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {timedPractice ? "Timed practice enabled" : "Start timed practice"}
                    </button>
                    <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                      {timedPractice
                        ? "Set a timer for the question, then report your answer here when done."
                        : "Choose timed practice when you want the tutor to treat the next question like an exam drill."}
                    </div>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
                    <p className="font-semibold text-indigo-900">Topic confidence</p>
                    <div className="mt-4 space-y-3 text-sm">
                      <div>
                        <div className="flex justify-between text-indigo-800">
                          <span>Algebra</span>
                          <span>Strong</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-white">
                          <div className="h-2 w-4/5 rounded-full bg-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-indigo-800">
                          <span>Geometry</span>
                          <span>Needs work</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-white">
                          <div className="h-2 w-2/5 rounded-full bg-amber-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                  <Timer className="mx-auto h-10 w-10 text-slate-400" />
                  <h3 className="mt-3 font-semibold text-slate-900">Exam prep unlocks in Grade 11-12</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    You can still use Socratic tutor, practice quiz, and writing feedback now. EUEE mode appears for senior exam preparation.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
