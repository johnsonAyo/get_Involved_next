/**
 * LLM-FREE summary matcher.
 *
 * Given a user's ≤30-char body, return the top 3–5 canonical-summary
 * candidates from `CIVIC_SUMMARIES` whose keywords match as substrings
 * of the (normalized) body.
 *
 * No LLM call. No network. No async. Pure function so the matcher is
 * unit-testable in isolation and runs at O(L) per request — i.e. safe
 * to call 100k times per second without bill exposure.
 *
 * The matcher is intentionally simple: substring search over a
 * pre-flattened keyword array. The keyword table is pre-sorted
 * longest-first so the most specific phrase wins on ties. Vocabulary
 * size is bounded (≈30 entries at first pass, ≈150 at maturity), so
 * the linear scan is well under 1ms for a 30-char input.
 *
 * If zero canonical entries match (`match() returns []`), the caller
 * should fall back to using the body itself as the `summary`, marked
 * with the `novel:` prefix (or whatever the canonical convention is
 * downstream). The matcher never invents a tag; the worst-case path
 * is "no canonical match → fall back" rather than "hallucinated tag".
 */

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
  const matches = match(body, limit);

  if (matches.length === 0) {
    // No keyword hit. Synthesize a single novel summary from the body
    // itself so the user always has at least one chip to pick.
    const normalized = normalizeBody(body);
    if (normalized.length >= 4) {
      return [
        {
          id: `novel-${normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
          summary: normalized,
          matchedKeyword: normalized,
        },
      ];
    }
    return [];
  }

  // Already have canonicals. If fewer than `limit`, top up with a
  // body-as-novel chip so the picker always has a fallback if the
  // user wants to use their own phrasing.
  if (matches.length < limit) {
    const normalized = normalizeBody(body);
    const novelId = `novel-${normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    if (!matches.some((m) => m.id === novelId) && normalized.length >= 4) {
      matches.push({
        id: novelId,
        summary: normalized,
        matchedKeyword: normalized,
      });
    }
  }

  return matches.slice(0, limit);
}

/**
 * Profanity heuristic for the post-publish check. Deliberately tiny
 * (a vocab list, not a model). Returns true if `summary` contains a
 * banned term. Server-side reject still happens in the server
 * action; this is a cheap pre-check usable from the client too.
 *
 * NOTE: this list is hand-curated + small. The studio moderation
 * queue (slice 3) handles the long tail. Keep this list focused on
 * slurs + civic-context hostility; do NOT add general profanity.
 */
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
