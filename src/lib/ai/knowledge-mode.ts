/** How the tutor grounds answers: textbook RAG vs general curriculum knowledge. */

export const TUTOR_KNOWLEDGE_MODES = ["rag", "general"] as const;

export type TutorKnowledgeMode = (typeof TUTOR_KNOWLEDGE_MODES)[number];

export function isTutorKnowledgeMode(value: string): value is TutorKnowledgeMode {
  return (TUTOR_KNOWLEDGE_MODES as readonly string[]).includes(value);
}

export const TUTOR_KNOWLEDGE_MODE_OPTIONS: ReadonlyArray<{
  value: TutorKnowledgeMode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "rag",
    label: "Textbook knowledge (RAG)",
    shortLabel: "Textbook (RAG)",
    description:
      "Answers are grounded in the selected chapter and uploaded textbook excerpts.",
  },
  {
    value: "general",
    label: "General tutor (no RAG)",
    shortLabel: "General (no RAG)",
    description:
      "Socratic help using grade-level subject knowledge without textbook page citations.",
  },
];

export function getKnowledgeModeLabel(mode: TutorKnowledgeMode): string {
  return TUTOR_KNOWLEDGE_MODE_OPTIONS.find((option) => option.value === mode)?.shortLabel ?? mode;
}
