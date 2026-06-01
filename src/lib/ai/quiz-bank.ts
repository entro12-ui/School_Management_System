/**
 * Subject-aware practice quiz items for the AI Study Tutor.
 */

export type QuizQuestion = {
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

export type QuizChapterContext = {
  gradeLevel: number;
  subject: string;
  chapterNumber: number;
  chapterTitle: string;
  pageStart: number;
  pageEnd: number;
};

type PageRef = (offset: number) => number;

function normalizeSubject(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("math")) return "mathematics";
  if (s.includes("physics")) return "physics";
  if (s.includes("chem")) return "chemistry";
  if (s.includes("bio")) return "biology";
  if (s.includes("environmental")) return "environmental_science";
  if (s === "science") return "science";
  if (s.includes("english")) return "english";
  if (s.includes("history")) return "history";
  if (s.includes("geograph")) return "geography";
  if (s.includes("civic")) return "civics";
  if (s.includes("social")) return "social_studies";
  if (s.includes("econom")) return "economics";
  if (s.includes("amharic") || s.includes("oromo") || s.includes("tigrigna") || s.includes("somali"))
    return "language";
  return "general";
}

function pages(chapter: QuizChapterContext): PageRef {
  return (offset: number) => Math.min(chapter.pageStart + offset, chapter.pageEnd);
}

function mathQuiz(chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  if (chapter.chapterNumber >= 2 || chapter.chapterTitle.toLowerCase().includes("fraction")) {
    return [
      {
        id: 1,
        type: "multiple_choice",
        question: "In a fraction, what does the denominator represent?",
        options: [
          "A. The number of parts selected",
          "B. The total number of equal parts in the whole",
          "C. The answer after adding fractions",
        ],
        correctAnswer: "B",
        explanation: `The denominator is the bottom number — it tells how many equal parts the whole is divided into (see page ${p(0)}).`,
        pageReference: p(0),
        difficulty: "easy",
        topic: "Denominator",
      },
      {
        id: 2,
        type: "true_false",
        question: "The numerator counts how many equal parts are taken or shaded.",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: `The numerator is the top number; it tells how many of those equal parts you have (page ${p(1)}).`,
        pageReference: p(1),
        difficulty: "easy",
        topic: "Numerator",
      },
      {
        id: 3,
        type: "fill_blank",
        question: "When denominators are the same, compare fractions by looking at their ____.",
        correctAnswer: "numerators",
        explanation: `If denominators match, the larger numerator means the larger fraction (page ${p(2)}).`,
        pageReference: p(2),
        difficulty: "medium",
        topic: "Comparing fractions",
      },
    ];
  }

  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "Which expression shows 24 as a product of prime factors?",
      options: ["A. 4 × 6", "B. 2 × 2 × 2 × 3", "C. 8 + 3"],
      correctAnswer: "B",
      explanation: `Prime factorization writes a number as primes multiplied together: 24 = 2³ × 3 (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "medium",
      topic: "Prime factors",
    },
    {
      id: 2,
      type: "true_false",
      question: "The least common multiple (LCM) of two numbers is always smaller than both numbers.",
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: `The LCM is the smallest number both numbers divide into — it is often larger than one or both numbers (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "LCM",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "To find the greatest common factor (GCF), list the factors of each number and pick the largest ____ factor.",
      correctAnswer: "common",
      explanation: `The GCF is the largest whole number that divides both numbers without a remainder (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "GCF",
    },
  ];
}

function physicsQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "What is a force in physics?",
      options: [
        "A. A push or pull that can change motion",
        "B. The amount of matter in an object",
        "C. The distance an object travels",
      ],
      correctAnswer: "A",
      explanation: `A force is an interaction that can start, stop, or change the direction of motion (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Force",
    },
    {
      id: 2,
      type: "true_false",
      question: "According to Newton's first law, an object keeps its state of motion unless a net force acts on it.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Inertia means objects resist changes in motion — this is the basis of the first law (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Newton's first law",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "The SI unit of force is the ____.",
      correctAnswer: "newton",
      explanation: `One newton (N) is about the force needed to accelerate 1 kg at 1 m/s² (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Units",
    },
  ];
}

function chemistryQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "What is the smallest unit of an element that keeps its chemical identity?",
      options: ["A. Atom", "B. Molecule", "C. Mixture"],
      correctAnswer: "A",
      explanation: `Atoms are the building blocks of elements; molecules form when atoms bond (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Atoms",
    },
    {
      id: 2,
      type: "true_false",
      question: "A compound always contains two or more different elements chemically combined.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Water (H₂O) is a compound because hydrogen and oxygen are bonded in fixed ratios (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Compounds",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "The periodic table organizes elements by atomic number and similar ____.",
      correctAnswer: "properties",
      explanation: `Elements in the same group often share chemical properties (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Periodic table",
    },
  ];
}

function biologyQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "Which organelle is often called the control center of the cell?",
      options: ["A. Nucleus", "B. Cell wall", "C. Ribosome"],
      correctAnswer: "A",
      explanation: `The nucleus holds DNA and directs cell activities (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Cell structure",
    },
    {
      id: 2,
      type: "true_false",
      question: "Photosynthesis converts light energy into chemical energy stored in glucose.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Plants use CO₂, water, and sunlight to make glucose and release oxygen (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Photosynthesis",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "The basic unit of life is the ____.",
      correctAnswer: "cell",
      explanation: `All living organisms are made of one or more cells (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "easy",
      topic: "Cells",
    },
  ];
}

function scienceQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "What is the main job of plant roots?",
      options: [
        "A. Make food using sunlight",
        "B. Anchor the plant and absorb water",
        "C. Release oxygen into the air",
      ],
      correctAnswer: "B",
      explanation: `Roots take in water and minerals and hold the plant in the soil (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Roots",
    },
    {
      id: 2,
      type: "true_false",
      question: "The stem carries water and nutrients to the leaves.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Vascular tissue in the stem transports water upward (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Stem",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "Leaves use sunlight in the process called ____.",
      correctAnswer: "photosynthesis",
      explanation: `Photosynthesis produces food for the plant and releases oxygen (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Leaves",
    },
  ];
}

function englishQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "What is the main idea of a paragraph?",
      options: [
        "A. The most important point the author makes",
        "B. The longest sentence",
        "C. The title of the book only",
      ],
      correctAnswer: "A",
      explanation: `The main idea is what the paragraph is mostly about (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Main idea",
    },
    {
      id: 2,
      type: "true_false",
      question: "Supporting details give evidence or examples for the main idea.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Details explain, prove, or illustrate the main idea (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Supporting details",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "A good summary restates the main idea and the most important ____.",
      correctAnswer: "details",
      explanation: `Summaries are shorter than the original but keep key information (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Summary",
    },
  ];
}

function historyQuiz(chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "A primary source in history is best described as:",
      options: [
        "A. An account written long after events",
        "B. Evidence from the time period itself",
        "C. A modern textbook summary",
      ],
      correctAnswer: "B",
      explanation: `Letters, artifacts, and eyewitness records from the period are primary sources (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Sources",
    },
    {
      id: 2,
      type: "true_false",
      question: "Cause and effect relationships help explain why historical events happened.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Historians trace causes (economic, political, social) to understand outcomes (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Cause and effect",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "Putting events in order from earliest to latest is called a ____.",
      correctAnswer: "chronology",
      explanation: `Timelines use chronology to show how events connect over time (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Chronology",
    },
  ];
}

function geographyQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "Lines of latitude measure distance:",
      options: ["A. East and west of the Prime Meridian", "B. North and south of the equator", "C. Only on maps of cities"],
      correctAnswer: "B",
      explanation: `Latitude runs parallel to the equator; longitude runs north–south through poles (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Latitude",
    },
    {
      id: 2,
      type: "true_false",
      question: "Climate describes long-term weather patterns in a region.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Weather is short-term; climate averages conditions over many years (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Climate",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "Height above sea level on a map is shown by ____ lines.",
      correctAnswer: "contour",
      explanation: `Contour lines connect points of equal elevation (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Relief",
    },
  ];
}

function civicsQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "In a democracy, ultimate political power belongs to:",
      options: ["A. The people", "B. One hereditary ruler", "C. The military only"],
      correctAnswer: "A",
      explanation: `Citizens take part through voting, representation, and civic duties (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Democracy",
    },
    {
      id: 2,
      type: "true_false",
      question: "The rule of law means everyone, including leaders, must follow the law.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Equal application of laws protects rights and limits abuse of power (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Rule of law",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "Rights such as freedom of expression are protected in a country's ____.",
      correctAnswer: "constitution",
      explanation: `Constitutions set out government structure and fundamental rights (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Constitution",
    },
  ];
}

function socialStudiesQuiz(chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return historyQuiz(chapter, p);
}

function economicsQuiz(_chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: "Scarcity in economics means:",
      options: [
        "A. Unlimited resources for everyone",
        "B. Limited resources but unlimited wants",
        "C. Prices never change",
      ],
      correctAnswer: "B",
      explanation: `Because wants exceed resources, people must make choices (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Scarcity",
    },
    {
      id: 2,
      type: "true_false",
      question: "Demand generally increases when the price of a good falls, other things equal.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `The law of demand describes this inverse relationship (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Demand",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "The money, tools, and factories used to produce goods are called ____ of production.",
      correctAnswer: "factors",
      explanation: `Land, labor, capital, and entrepreneurship are factors of production (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Factors of production",
    },
  ];
}

function languageQuiz(chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: `When learning ${chapter.subject}, why is daily vocabulary practice useful?`,
      options: [
        "A. It builds reading and writing fluency over time",
        "B. It replaces grammar completely",
        "C. It is only for exams, not communication",
      ],
      correctAnswer: "A",
      explanation: `Regular vocabulary work improves comprehension and expression (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: "Vocabulary",
    },
    {
      id: 2,
      type: "true_false",
      question: "Accent marks or script forms can change the meaning of a word in many languages.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Pay attention to spelling, tone, and script when reading and writing (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Script",
    },
    {
      id: 3,
      type: "fill_blank",
      question: "The subject of a sentence usually tells who or what performs the ____.",
      correctAnswer: "action",
      explanation: `Identifying subject and predicate helps parse sentences in any language (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Grammar",
    },
  ];
}

function generalQuiz(chapter: QuizChapterContext, p: PageRef): QuizQuestion[] {
  return [
    {
      id: 1,
      type: "multiple_choice",
      question: `What is the main focus of "${chapter.chapterTitle}" in ${chapter.subject}?`,
      options: [
        "A. Core concepts and examples for this chapter",
        "B. Unrelated topics from another subject",
        "C. Only exam dates",
      ],
      correctAnswer: "A",
      explanation: `This chapter introduces key Grade ${chapter.gradeLevel} ${chapter.subject} ideas (page ${p(0)}).`,
      pageReference: p(0),
      difficulty: "easy",
      topic: chapter.subject,
    },
    {
      id: 2,
      type: "true_false",
      question: "Review questions at the end of a chapter help check understanding.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: `Practice and review connect examples to the main skills (page ${p(1)}).`,
      pageReference: p(1),
      difficulty: "easy",
      topic: "Review",
    },
    {
      id: 3,
      type: "fill_blank",
      question: `A useful study habit is to explain the chapter idea in your own ____.`,
      correctAnswer: "words",
      explanation: `Teaching the idea aloud or in writing shows what you truly understand (page ${p(2)}).`,
      pageReference: p(2),
      difficulty: "medium",
      topic: "Study skills",
    },
  ];
}

const QUIZ_BY_SUBJECT: Record<
  string,
  (chapter: QuizChapterContext, p: PageRef) => QuizQuestion[]
> = {
  mathematics: mathQuiz,
  physics: physicsQuiz,
  chemistry: chemistryQuiz,
  biology: biologyQuiz,
  science: scienceQuiz,
  environmental_science: scienceQuiz,
  english: englishQuiz,
  history: historyQuiz,
  geography: geographyQuiz,
  civics: civicsQuiz,
  social_studies: socialStudiesQuiz,
  economics: economicsQuiz,
  language: languageQuiz,
  general: generalQuiz,
};

export function buildQuizQuestions(chapter: QuizChapterContext): QuizQuestion[] {
  const key = normalizeSubject(chapter.subject);
  const builder = QUIZ_BY_SUBJECT[key] ?? QUIZ_BY_SUBJECT.general;
  return builder(chapter, pages(chapter));
}

export function formatQuizQuestionMeta(
  question: QuizQuestion,
  chapter: QuizChapterContext,
  citePages: boolean
): string {
  if (citePages) {
    return `Page ${question.pageReference} · ${question.topic} · ${question.difficulty}`;
  }
  return `Grade ${chapter.gradeLevel} ${chapter.subject} · ${question.topic} · ${question.difficulty}`;
}
