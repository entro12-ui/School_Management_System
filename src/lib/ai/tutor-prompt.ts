import type { TutorKnowledgeMode } from "@/lib/ai/knowledge-mode";
import { getOllamaMaxHistory } from "@/lib/ai/config";
import { retrieveRelevantPassages } from "@/lib/ai/rag-retrieval";
import type { OllamaChatMessage } from "@/lib/ai/ollama";

export type TutorChapterContext = {
  gradeLevel: number;
  subject: string;
  chapterNumber: number;
  chapterTitle: string;
  pageStart: number;
  pageEnd: number;
  language: string;
  chunks: string[];
};

export type TutorSessionContext = {
  studentName: string;
  schoolName: string;
  className?: string | null;
  stream?: string | null;
  chapter: TutorChapterContext;
  knowledgeMode: TutorKnowledgeMode;
  ragSnippets?: string[];
};

export type TutorHistoryMessage = {
  role: "student" | "tutor";
  text: string;
};

function gradeLabel(gradeLevel: number) {
  return gradeLevel === 0 ? "KG" : `Grade ${gradeLevel}`;
}

const CORE_RULES = `Rules: Match the student's question topic and grade. Max 4 sentences + at most 1 short follow-up question. Use the student's language when obvious. Do not give full homework solutions (no complete worked answers for "solve/find x" tasks).`;

const DIRECT_ANSWER_RULES = `If the student asks what something IS (e.g. "what is an equation", "define fraction", "explain photosynthesis", "tell me about…"): answer directly first with a clear, accurate definition or explanation at their grade level (2–3 sentences). Only then add one brief check question. Never deflect with "what do you already know?" or "which topic are you on?" for these questions.`;

function generalModeRules(grade: string) {
  return `Mode: GENERAL — use standard ${grade} school knowledge for the topic in the question. Sidebar subject is optional context only.`;
}

export function buildRagContextForQuery(
  ctx: TutorSessionContext,
  userMessage: string
): string[] {
  const pool = [...ctx.chapter.chunks, ...(ctx.ragSnippets ?? [])];
  return retrieveRelevantPassages(userMessage, pool, { maxResults: 3 });
}

export function buildTutorSystemPrompt(
  ctx: TutorSessionContext,
  retrievedPassages?: string[]
): string {
  const grade = gradeLabel(ctx.chapter.gradeLevel);

  if (ctx.knowledgeMode === "general") {
    return `You are a ${grade} study tutor for ${ctx.studentName}.
${generalModeRules(grade)}
Answer the topic in the student's question (math, science, history, etc.) — not limited to sidebar subject "${ctx.chapter.subject}".
${CORE_RULES}
${DIRECT_ANSWER_RULES}
Do not invent textbook page numbers.`;
  }

  const passages =
    retrievedPassages ?? buildRagContextForQuery(ctx, "");
  const textbookContext = passages.map((chunk) => `- ${chunk}`).join("\n");

  return `You are a ${grade} study tutor. Subject: ${ctx.chapter.subject}. Chapter ${ctx.chapter.chapterNumber} (p.${ctx.chapter.pageStart}-${ctx.chapter.pageEnd}).
Mode: TEXTBOOK RAG — use ONLY the passages below. Cite pages when relevant.
${CORE_RULES}
${DIRECT_ANSWER_RULES}
If not in passages, say it is outside this chapter.

PASSAGES:
${textbookContext}`;
}

export function buildTutorChatMessages(
  ctx: TutorSessionContext,
  history: TutorHistoryMessage[],
  userMessage: string
): OllamaChatMessage[] {
  const retrievedPassages =
    ctx.knowledgeMode === "rag" ? buildRagContextForQuery(ctx, userMessage) : undefined;

  const maxTurns = getOllamaMaxHistory();
  const messages: OllamaChatMessage[] = [
    { role: "system", content: buildTutorSystemPrompt(ctx, retrievedPassages) },
  ];

  for (const entry of history.slice(-maxTurns)) {
    messages.push({
      role: entry.role === "student" ? "user" : "assistant",
      content: entry.text,
    });
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}
