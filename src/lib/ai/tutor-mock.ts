import type { TutorKnowledgeMode } from "@/lib/ai/knowledge-mode";
import type { TutorChapterContext } from "@/lib/ai/tutor-prompt";

function hasChapterCoverage(question: string, keywords: string[]) {
  const normalized = question.toLowerCase();
  const meaningfulWords = normalized
    .split(/[^a-z]+/)
    .filter((word) => word.length > 3);

  if (meaningfulWords.length === 0) return true;
  return meaningfulWords.some((word) => keywords.includes(word));
}

function isFrustrated(question: string) {
  const normalized = question.toLowerCase();
  return ["i don't understand", "this is hard", "i give up", "confused", "difficult"].some(
    (phrase) => normalized.includes(phrase)
  );
}

type TopicHint = {
  test: RegExp;
  label: string;
  opener: string;
  question: string;
};

const GENERAL_TOPIC_HINTS: TopicHint[] = [
  {
    test: /heart|blood|circulat|pump|organ|body|biology|cell/i,
    label: "biology",
    opener:
      "The heart is a muscle that pumps blood around your body so cells get oxygen and nutrients.",
    question: "What do you think happens to blood when it leaves the heart — does it go to the lungs, the body, or both?",
  },
  {
    test: /plant|root|leaf|stem|photosynth/i,
    label: "biology",
    opener: "Plants have parts that work together: roots take in water, stems support, leaves make food using light.",
    question: "Which plant part do you think moves water upward — the roots, stem, or leaves?",
  },
  {
    test: /math|maths|fraction|number|equation|algebra|geometry|calculat/i,
    label: "mathematics",
    opener:
      "Learning math works best in small steps: understand the idea, try one example, then check your work.",
    question: "What are you working on right now — fractions, equations, or something else?",
  },
  {
    test: /history|war|empire|revolution|past/i,
    label: "history",
    opener: "History questions are easier when you name the time, place, and main people or causes first.",
    question: "Which time period or event is your question about?",
  },
  {
    test: /english|essay|paragraph|grammar|writing|read/i,
    label: "English",
    opener: "For reading and writing, start with the main idea, then find one piece of evidence that supports it.",
    question: "Are you trying to understand a text, or improve something you wrote?",
  },
];

function matchTopicHint(question: string): TopicHint | null {
  return GENERAL_TOPIC_HINTS.find((hint) => hint.test.test(question)) ?? null;
}

function buildGeneralMockReply(question: string, gradeLevel: number): string {
  if (isFrustrated(question)) {
    return "You are doing fine — let's go one small step at a time. What is the one part of your question that you already understand, even a little?";
  }

  const hint = matchTopicHint(question);
  if (hint) {
    return `${hint.opener} ${hint.question}`;
  }

  if (gradeLevel <= 6) {
    return "Good question. Tell me what you already know about this topic in one sentence, and which single part feels confusing.";
  }

  return "Strong question. Name the key idea you think applies, then I will help you test whether that idea fits.";
}

export function buildMockTutorReply(
  question: string,
  chapter: TutorChapterContext & { keywords: string[]; nextChapter: number },
  gradeLevel: number,
  knowledgeMode: TutorKnowledgeMode
): string {
  if (knowledgeMode === "general") {
    return buildGeneralMockReply(question, gradeLevel);
  }

  if (!hasChapterCoverage(question, chapter.keywords)) {
    return `That topic isn't in this chapter. Check with your teacher, or it may be covered in Chapter ${chapter.nextChapter}.`;
  }

  const page = question.toLowerCase().includes("compare")
    ? Math.min(chapter.pageStart + 5, chapter.pageEnd)
    : chapter.pageStart;

  if (isFrustrated(question)) {
    return `You are doing fine. Let's slow it down. As your book explains on page ${chapter.pageStart}, this chapter starts with one basic idea: ${chapter.chunks[0]?.replace(/^Page \d+: /, "") ?? "the opening idea"} Can you point to the part of the example that shows the whole?`;
  }

  if (gradeLevel <= 6) {
    return `As your book explains on page ${page}, start by finding the key idea first. Do not rush to the final answer yet. What part of the example should we look at first?`;
  }

  if (gradeLevel <= 8) {
    return `As your book explains on page ${page}, identify the key term in the question before solving it. For this chapter, decide which textbook example matches the question. Which example do you think applies?`;
  }

  return `As your book explains on page ${page}, begin by naming the concept being tested, then justify each step using the chapter rule. Can you state the rule from the page in your own words first?`;
}
