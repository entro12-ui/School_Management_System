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

/** Student wants a definition or explanation, not homework help. */
function wantsDirectExplanation(question: string) {
  const q = question.trim().toLowerCase();
  return (
    /^(what is|what are|what's|whats|define|explain|tell me about|describe|meaning of)\b/.test(
      q
    ) || /\bwhat is an?\b|\bwhat are\b|\bwhat does\b|\bhow does\b.*\bwork\b/.test(q)
  );
}

type DefinitionAnswer = {
  test: RegExp;
  reply: (gradeLevel: number) => string;
};

const DEFINITION_ANSWERS: DefinitionAnswer[] = [
  {
    test: /\bequation/i,
    reply: (grade) =>
      grade <= 6
        ? "An equation is a maths sentence with an equals sign (=) showing two sides have the same value. For example, 2 + 3 = 5, or x + 4 = 9 where x is the unknown number. Can you write one equation that uses a letter for the unknown?"
        : "An equation is a statement that two expressions are equal, written with an '=' sign. One or more variables may stand for unknown values (e.g. 2x + 1 = 7). Solving means finding the value(s) of the variable that make the statement true. Try solving 2x + 1 = 7 — what is x?",
  },
  {
    test: /\bfraction/i,
    reply: (grade) =>
      grade <= 6
        ? "A fraction shows parts of a whole. The bottom number (denominator) tells how many equal parts the whole is split into; the top (numerator) tells how many parts you have. For example, 3/4 means 3 parts out of 4. Can you name the numerator and denominator in 2/5?"
        : "A fraction represents a ratio of two integers, a/b, where b ≠ 0. It can mean part of a whole, a point on the number line, or a division. Which fraction is larger, 3/8 or 1/2, and how do you know?",
  },
  {
    test: /\bvariable|unknown/i,
    reply: () =>
      "A variable is a symbol (often a letter like x) that stands for a number we do not know yet. In an equation, we solve to find its value. What letter is used as the unknown in your problem?",
  },
  {
    test: /\bcell\b/i,
    reply: (grade) =>
      grade <= 8
        ? "A cell is the smallest unit of life. All living things are made of one or more cells. Plant and animal cells have parts such as a nucleus that controls the cell. What living thing are you studying — plants, animals, or both?"
        : "A cell is the basic structural and functional unit of life, surrounded by a membrane and containing organelles such as the nucleus (DNA) and mitochondria (energy). How do plant and animal cells differ in your notes?",
  },
  {
    test: /\bphotosynthesis/i,
    reply: () =>
      "Photosynthesis is how green plants use sunlight, water, and carbon dioxide to make glucose (food) and release oxygen. It mainly happens in the leaves. What three things does a plant need for photosynthesis?",
  },
  {
    test: /\b(numerator|denominator)\b/i,
    reply: () =>
      "In a fraction, the denominator is the bottom number — how many equal parts the whole is divided into. The numerator is the top number — how many of those parts you have. In 5/8, which number is the numerator?",
  },
];

function buildDefinitionMockReply(question: string, gradeLevel: number): string | null {
  if (!wantsDirectExplanation(question)) return null;

  for (const entry of DEFINITION_ANSWERS) {
    if (entry.test.test(question)) {
      return entry.reply(gradeLevel);
    }
  }

  const topic = question
    .replace(/^(what is|what are|what's|whats|define|explain|tell me about|describe)\s+/i, "")
    .replace(/\?+$/, "")
    .trim();

  if (topic.length > 1) {
    return gradeLevel <= 6
      ? `${topic.charAt(0).toUpperCase()}${topic.slice(1)} is an important idea in your subject. In simple terms, it is a key concept your teacher wants you to know at Grade ${gradeLevel}. Can you say in your own words what you think it means before we refine it?`
      : `Here is a start on "${topic}": it is a core concept at Grade ${gradeLevel} level. State the definition you remember, and I will help you correct or extend it.`;
  }

  return null;
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
    test: /math|maths|algebra|geometry|calculat/i,
    label: "mathematics",
    opener:
      "Mathematics builds ideas step by step: learn the definition, try one example, then check your reasoning.",
    question: "What topic are you studying — numbers, shapes, or equations?",
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
  {
    test: /motion|newton|force|velocity|accelerat|physics|inertia|friction|momentum|law of motion/i,
    label: "physics",
    opener:
      "Newton's laws describe how forces change motion. The first law says an object stays at rest or moves at constant velocity unless a net force acts on it. The second links force, mass, and acceleration (F = ma). The third says forces come in equal and opposite pairs.",
    question:
      "Which law fits a book sitting on a table until you push it — the first, second, or third?",
  },
  {
    test: /energy|work|power|heat|temperature|thermo/i,
    label: "physics",
    opener:
      "Energy is the ability to do work. It can move between forms (motion, heat, height) but is conserved in a closed system.",
    question: "Can you name one example where energy changes form, like from motion to heat?",
  },
  {
    test: /chemistry|atom|molecule|element|reaction|acid|base/i,
    label: "chemistry",
    opener:
      "Chemistry studies what matter is made of and how substances change. Atoms join into molecules; reactions rearrange atoms into new substances.",
    question: "What substance are you studying — elements, compounds, or reactions?",
  },
];

function matchTopicHint(question: string): TopicHint | null {
  return GENERAL_TOPIC_HINTS.find((hint) => hint.test.test(question)) ?? null;
}

function buildGeneralMockReply(
  question: string,
  gradeLevel: number,
  sidebarSubject?: string
): string {
  if (isFrustrated(question)) {
    return "You are doing fine — let's go one small step at a time. What is the one part of your question that you already understand, even a little?";
  }

  const definitionReply = buildDefinitionMockReply(question, gradeLevel);
  if (definitionReply) {
    return definitionReply;
  }

  const hint = matchTopicHint(question);
  if (hint) {
    return `${hint.opener} ${hint.question}`;
  }

  const subject = sidebarSubject?.toLowerCase() ?? "";
  if (subject.includes("physics") && /law|motion|force|chapter|unit/i.test(question)) {
    return `Newton's laws are core in ${sidebarSubject ?? "physics"}. Start with the first law: without a net force, motion does not change. The second connects force and acceleration; the third involves action–reaction pairs. Which law do you think explains a ball slowing down on grass?`;
  }

  if (gradeLevel <= 6) {
    return "Good question. Here is a start: every topic has a main idea and an example. What is the topic called in your own words, and what part is hardest?";
  }

  return "Good question. In one or two sentences, what do you think the main idea is? I will help you check it and add the key fact you are missing.";
}

export function buildMockTutorReply(
  question: string,
  chapter: TutorChapterContext & { keywords: string[]; nextChapter: number },
  gradeLevel: number,
  knowledgeMode: TutorKnowledgeMode
): string {
  if (knowledgeMode === "general") {
    return buildGeneralMockReply(question, gradeLevel, chapter.subject);
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
