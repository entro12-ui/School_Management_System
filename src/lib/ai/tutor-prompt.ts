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

const CORE_RULES = `Rules: Socratic tutor only — short hints, no full homework solutions. Max 4 sentences + 1 question. Match the student's question topic. Language: use the student's language when obvious.`;

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
    return `You are a ${grade} Socratic tutor for ${ctx.studentName}.
Mode: GENERAL (no textbook). Answer the topic in the student's question (biology, math, history, etc.) — NOT limited to sidebar subject "${ctx.chapter.subject}" unless the question is about that subject.
${CORE_RULES}
Do not invent textbook page numbers.`;
  }

  const passages =
    retrievedPassages ?? buildRagContextForQuery(ctx, "");
  const textbookContext = passages.map((chunk) => `- ${chunk}`).join("\n");

  return `You are a ${grade} Socratic tutor. Subject: ${ctx.chapter.subject}. Chapter ${ctx.chapter.chapterNumber} (p.${ctx.chapter.pageStart}-${ctx.chapter.pageEnd}).
Mode: TEXTBOOK RAG — use ONLY the passages below. Cite pages when relevant.
${CORE_RULES}
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
