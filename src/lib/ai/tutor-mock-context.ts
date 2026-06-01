import type { TutorHistoryMessage } from "@/lib/ai/tutor-prompt";

function lastTutorTurn(history: TutorHistoryMessage[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i]?.role === "tutor") return history[i].text;
  }
  return "";
}

function extractEquation(text: string): string | null {
  const normalized = text.replace(/\s+/g, " ");
  const patterns = [
    /\b[a-z]\s*\+\s*-?\d+(?:\.\d+)?\s*=\s*-?\d+(?:\.\d+)?/i,
    /\b\d+\s*[a-z]\s*\+\s*-?\d+\s*=\s*-?\d+/i,
    /\b[a-z]\s*=\s*-?\d+(?:\.\d+)?/i,
    /\b[a-z]\s*=\s*[a-z]\s*\+\s*-?\d+/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return match[0].replace(/\s+/g, " ");
  }
  return null;
}

function extractFraction(text: string): { num: string; den: string; raw: string } | null {
  const match = text.match(/\b(\d+)\s*\/\s*(\d+)\b/);
  if (!match) return null;
  return { num: match[1], den: match[2], raw: `${match[1]}/${match[2]}` };
}

/**
 * Short student replies that continue the previous tutor turn (fallback / offline tutor).
 */
export function buildContextualFollowUpReply(
  question: string,
  history: TutorHistoryMessage[],
  gradeLevel: number
): string | null {
  if (history.length === 0) return null;

  const lastTutor = lastTutorTurn(history);
  if (!lastTutor) return null;

  const trimmed = question.trim();
  const lower = trimmed.toLowerCase();
  const equation = extractEquation(trimmed);

  if (
    /linear equation/i.test(lastTutor) ||
    (/equation/i.test(lastTutor) &&
      /letter for the unknown|write one equation|equation with x|linear/i.test(lastTutor))
  ) {
    if (equation) {
      const variable = equation.match(/[a-z]/i)?.[0] ?? "x";
      if (/linear equation/i.test(lastTutor) || /linear/i.test(history.map((h) => h.text).join(" "))) {
        return `Good work — ${equation} is an equation. A linear equation uses the variable only to the first power (no squares like x²). Here the letter ${variable} stands for a number. If ${equation} means ${variable} equals that value, both sides of "=" balance. Can you write a linear equation where ${variable} is still unknown, such as ${variable} + 3 = 8?`;
      }
      return `Yes — ${equation} is an equation: the letter ${variable} is the unknown (or its value), and the equals sign shows both sides match. Nice example. Can you write one more where ${variable} appears on both sides, like ${variable} + 2 = 7?`;
    }
    if (/^(yes|yeah|yep|sure|ok|okay)\b/i.test(lower)) {
      return `Great — try writing one equation with a letter for the unknown, for example x + 4 = 9. What value of x would make that true?`;
    }
  }

  if (/numerator|denominator/i.test(lastTutor)) {
    const frac = extractFraction(trimmed);
    if (frac) {
      return `In ${frac.raw}, the numerator is ${frac.num} (top — how many parts you have) and the denominator is ${frac.den} (bottom — how many equal parts in the whole). Which part tells how the whole is divided?`;
    }
  }

  if (/what is x|what is y|find (the )?value|solve/i.test(lastTutor) && equation) {
    return `You wrote ${equation}. Check both sides of the "=" — does the number on the right make the left side true? What step would you use to solve for the letter?`;
  }

  if (/photosynthesis/i.test(lastTutor) && /three things|what three/i.test(lastTutor)) {
    const mentions = ["sun", "light", "water", "co2", "carbon", "chlorophyll"].filter((w) =>
      lower.includes(w.replace("co2", "carbon"))
    );
    if (mentions.length >= 2) {
      return `Good — plants need light (energy), water, and carbon dioxide for photosynthesis, and they release oxygen. You named key inputs. Where in the plant does most photosynthesis happen?`;
    }
    if (/^(yes|yeah|ok)\b/i.test(lower)) {
      return `Think of three inputs: sunlight, water, and carbon dioxide. What gas do plants release as a product?`;
    }
  }

  if (/which law fits|first, second, or third/i.test(lastTutor)) {
    if (/first|1st|rest|stay/i.test(lower)) {
      return `The first law fits — without a net force, motion does not change (things stay at rest or keep steady speed). A book on a table stays still until you push it. What force stops a sliding book on the floor?`;
    }
    if (/second|2nd|f\s*=\s*ma|accelerat/i.test(lower)) {
      return `The second law links force, mass, and acceleration (F = ma). A bigger push on the same mass means more acceleration. Can you think of an everyday push that speeds something up?`;
    }
    if (/third|3rd|action|reaction|pair/i.test(lower)) {
      return `The third law — forces come in equal and opposite pairs. When you push a wall, it pushes back on you. What two forces act when you jump off the ground?`;
    }
  }

  const lastTutorQuestion = lastTutor.match(/[^.?!]*\?[^.?!]*$/)?.[0]?.trim();
  if (
    lastTutorQuestion &&
    trimmed.length < 80 &&
    !wantsNewTopicQuestion(trimmed) &&
    (equation || /^(yes|no|yeah|yep|sure|ok|okay|\d)/i.test(lower))
  ) {
    if (gradeLevel <= 6) {
      return `Thanks — that connects to my last question. ${answerShortAffirmation(trimmed, lastTutor)} ${lastTutorQuestion}`;
    }
    return `That answers what I asked before. ${answerShortAffirmation(trimmed, lastTutor)} What is your next step?`;
  }

  return null;
}

function wantsNewTopicQuestion(text: string) {
  return /^(what is|what are|define|explain|tell me about|how do|why do)\b/i.test(
    text.trim().toLowerCase()
  );
}

function answerShortAffirmation(studentText: string, lastTutor: string) {
  const eq = extractEquation(studentText);
  if (eq) return `${eq} fits what we were discussing about equations.`;
  if (/^yes\b/i.test(studentText)) return `You said yes — let's use that.`;
  if (/^no\b/i.test(studentText)) return `Okay — let's try another way.`;
  if (/equation/i.test(lastTutor)) return `Keep thinking about the equals sign and the unknown letter.`;
  return `Let's build on that.`;
}
