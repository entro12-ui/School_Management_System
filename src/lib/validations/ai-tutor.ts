import { TUTOR_KNOWLEDGE_MODES } from "@/lib/ai/knowledge-mode";
import { z } from "zod";

const historyMessageSchema = z.object({
  role: z.enum(["student", "tutor"]),
  text: z.string().min(1).max(4000),
});

const chapterContextSchema = z.object({
  gradeLevel: z.number().int().min(0).max(12),
  subject: z.string().min(1).max(120),
  chapterNumber: z.number().int().min(1).max(99),
  chapterTitle: z.string().min(1).max(200),
  pageStart: z.number().int().min(1),
  pageEnd: z.number().int().min(1),
  language: z.string().min(1).max(80),
  chunks: z.array(z.string().min(1)).min(1).max(20),
  keywords: z.array(z.string()).min(1).max(40),
  nextChapter: z.number().int().min(1).max(99),
});

export const aiTutorChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  history: z.array(historyMessageSchema).max(20).default([]),
  knowledgeMode: z.enum(TUTOR_KNOWLEDGE_MODES).default("rag"),
  ragSnippets: z.array(z.string().min(1).max(2000)).max(30).optional(),
  session: z.object({
    studentName: z.string().min(1).max(120),
    schoolName: z.string().min(1).max(200),
    className: z.string().max(120).nullable().optional(),
    stream: z.string().max(80).nullable().optional(),
    chapter: chapterContextSchema,
  }),
});

export type AiTutorChatRequest = z.infer<typeof aiTutorChatRequestSchema>;
