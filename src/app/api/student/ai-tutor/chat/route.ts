import { auth } from "@/lib/auth";
import {
  getOllamaModel,
  isAiTutorEnabled,
  useMockFallbackOnError,
} from "@/lib/ai/config";
import { ollamaChatStream, OllamaError } from "@/lib/ai/ollama";
import { buildMockTutorReply } from "@/lib/ai/tutor-mock";
import { buildRagContextForQuery, buildTutorChatMessages } from "@/lib/ai/tutor-prompt";
import { aiTutorChatRequestSchema } from "@/lib/validations/ai-tutor";

export const runtime = "nodejs";

type StreamEvent =
  | { type: "meta"; knowledgeMode: string; retrievedPassages?: string[] }
  | { type: "token"; text: string }
  | {
      type: "done";
      reply: string;
      source: "ollama" | "mock";
      model: string;
      knowledgeMode: string;
      retrievedPassages?: string[];
      fallbackReason?: string;
    }
  | { type: "error"; message: string; detail?: string };

function encodeEvent(encoder: TextEncoder, event: StreamEvent) {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAiTutorEnabled()) {
    return Response.json(
      { error: "AI Tutor is disabled on this server." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = aiTutorChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { message, history, session: tutorSession, knowledgeMode, ragSnippets } = parsed.data;
  const { chapter } = tutorSession;
  const gradeLevel = chapter.gradeLevel;
  const model = getOllamaModel();

  const sessionContext = {
    studentName: tutorSession.studentName,
    schoolName: tutorSession.schoolName,
    className: tutorSession.className,
    stream: tutorSession.stream,
    knowledgeMode,
    ragSnippets,
    chapter: {
      gradeLevel: chapter.gradeLevel,
      subject: chapter.subject,
      chapterNumber: chapter.chapterNumber,
      chapterTitle: chapter.chapterTitle,
      pageStart: chapter.pageStart,
      pageEnd: chapter.pageEnd,
      language: chapter.language,
      chunks: chapter.chunks,
    },
  };

  const retrievedPassages =
    knowledgeMode === "rag" ? buildRagContextForQuery(sessionContext, message) : [];

  const chatMessages = buildTutorChatMessages(sessionContext, history, message);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (event: StreamEvent) => {
        controller.enqueue(encodeEvent(encoder, event));
      };

      send({
        type: "meta",
        knowledgeMode,
        retrievedPassages: knowledgeMode === "rag" ? retrievedPassages : undefined,
      });

      try {
        let reply = "";
        for await (const token of ollamaChatStream(chatMessages)) {
          reply += token;
          send({ type: "token", text: token });
        }

        const trimmed = reply.trim();
        if (!trimmed) {
          throw new OllamaError("Ollama returned an empty response");
        }

        send({
          type: "done",
          reply: trimmed,
          source: "ollama",
          model,
          knowledgeMode,
          retrievedPassages: knowledgeMode === "rag" ? retrievedPassages : undefined,
        });
      } catch (error) {
        const ollamaMessage =
          error instanceof OllamaError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Ollama request failed";

        if (!useMockFallbackOnError()) {
          send({ type: "error", message: "AI Tutor unavailable", detail: ollamaMessage });
          controller.close();
          return;
        }

        const reply = buildMockTutorReply(message, chapter, gradeLevel, knowledgeMode);
        send({ type: "token", text: reply });
        send({
          type: "done",
          reply,
          source: "mock",
          model,
          knowledgeMode,
          retrievedPassages: knowledgeMode === "rag" ? retrievedPassages : undefined,
          fallbackReason: ollamaMessage,
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
