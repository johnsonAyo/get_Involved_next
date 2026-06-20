
import { buildKeywordIndex, normalizeBody } from "@/data/civic-phrases";

/**
 * Canonical civic-phrase row shape (mirrors `CIVIC_SUMMARIES[i]` in
 * `civic-phrases.js`). Defined inline here because the source is a
 * JS file — it has no TSDoc emit, so we re-declare the shape where
 * TS consumers can see it.
 */
export type CivicSummary = {
  id: string;
  summary: string;
  keywords: string[];
};

export type MatchedSummary = {
  /** Stable canonical id (e.g. "queue-slow"). Use for GROUP BY. */
  id: string;
  /** Human-voiced sentence (e.g. "the queue is slow"). Use for UI. */
  summary: string;
  /** Which keyword from the entry's vocabulary hit. */
  matchedKeyword: string;
};

const KEYWORD_INDEX = buildKeywordIndex();

/**
 * Match `body` against the canonical vocabulary.
 *
 * @param body  Raw, ≤30-char user input (composer input).
 * @param limit Top-N returned: 3 ≤ N ≤ 5.
 * @returns Deduplicated match list ordered by specificity (longest keyword wins).
 */
export function match(body: string, limit = 5): MatchedSummary[] {
  if (!body || typeof body !== "string") return [];

  const normalized = normalizeBody(body);
  if (normalized.length < 4) return [];

  const seen = new Set<string>();
  const results: MatchedSummary[] = [];

  for (const entry of KEYWORD_INDEX) {
    if (results.length >= limit) break;
    if (seen.has(entry.id)) continue;
    if (normalized.includes(entry.keyword)) {
      seen.add(entry.id);
      results.push({
        id: entry.id,
        summary: entry.summary,
        matchedKeyword: entry.keyword,
      });
    }
  }

  return results;
}

/**
 * Suggestable summaries for the composer UI, wrapped with the
 * `original` body so the composer can show a "novel / fallback"
 * chip alongside the canonical picks.
 *
 * The composer renders:
 *   1. {@link match}'s top result; if N ≥ 1
 *   2. Plus the `novel: <lowercased body>` chip if N < limit (still
 *      capped so the picker isn't bloated).
 *
 * @param body  Raw, ≤30-char user input.
 * @returns Array sized 1…limit+1 (depending on match rate).
 */
export function composerSuggestions(body: string): MatchedSummary[] {
  const limit = 5;
  return match(body, limit);
}
const BANNED_TERMS = [
  "kill",
  "die",
  "fool",
  "idiot",
  "thug",
  "thugs",
  "hate",
  "stupid",
  "trash",
  "scum",
];

export function containsHostileContent(summary: string): boolean {
  const normalized = summary.toLowerCase().trim();
  for (const term of BANNED_TERMS) {
    // Match as word (uses simple whitespace boundary) so "idiot" doesn't
    // hit "idiomatic".
    const re = new RegExp(`(^|[^a-z])${term}([^a-z]|$)`);
    if (re.test(normalized)) return true;
  }
  return false;
}
