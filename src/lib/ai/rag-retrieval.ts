/**
 * Lightweight RAG retrieval over chapter chunks (and optional uploaded snippets).
 * Uses keyword overlap — swap for embeddings + vector store when textbooks are indexed.
 */

const STOP_WORDS = new Set([
  "what",
  "when",
  "where",
  "which",
  "with",
  "from",
  "that",
  "this",
  "have",
  "does",
  "about",
  "help",
  "explain",
  "understand",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function scorePassage(queryTokens: string[], passage: string): number {
  if (queryTokens.length === 0) return 0;
  const passageTokens = new Set(tokenize(passage));
  let score = 0;
  for (const token of queryTokens) {
    if (passageTokens.has(token)) score += 1;
  }
  return score;
}

export function retrieveRelevantPassages(
  query: string,
  passages: string[],
  options?: { maxResults?: number; minScore?: number }
): string[] {
  const maxResults = options?.maxResults ?? 4;
  const minScore = options?.minScore ?? 1;
  const queryTokens = tokenize(query);

  const ranked = passages
    .map((passage, index) => ({
      passage,
      index,
      score: scorePassage(queryTokens, passage),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const relevant = ranked.filter((item) => item.score >= minScore).slice(0, maxResults);

  if (relevant.length > 0) {
    return relevant.map((item) => item.passage);
  }

  return passages.slice(0, Math.min(maxResults, passages.length));
}
