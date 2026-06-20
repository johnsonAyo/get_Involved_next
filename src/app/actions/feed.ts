"use server";

/**
 * Election Watch — post-slice server actions.
 *
 * Three endpoints:
 *
 *   • `suggestSummaries(body)`  ← LLM-free. Pure deterministic trie
 *     walk over the curated `CIVIC_SUMMARIES` vocabulary. Returns
 *     up to 5 candidate chips for the composer to render.
 *   • `publishFeedPost(args)`   ← write path. Validates body length,
 *     mint/reuse `feed_post_sessions`, profanity filter + content
 *     dedup, inserts into `feed_posts`. Service-role Supabase bypasses
 *     RLS so the user can write without auth.
 *   • `getFeedForPU(puId)`      ← read path. Returns chronological
 *     posts + interspersed join-events for a single polling unit.
 *
 * Anti-abuse happens in the write path. Detailed guards in
 * `publishFeedPost` itself.
 */

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import {
  composerSuggestions,
  containsHostileContent,
  type MatchedSummary,
} from "@/lib/summary-matcher";

// ─── Service-role Supabase (bypasses RLS for writes) ──────────────────────

function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// ─── Public types ────────────────────────────────────────────────────────

export type FeedPostRow = {
  id: string;
  polling_unit_id: string;
  poster_label: string;
  body: string;
  summary: string;
  posted_at: string;
  counter: number | null;
  joined_at: string | null;
  /** "join" lines have no body/summary and are computed at read time
   *  from `feed_post_sessions` rather than persisted as posts. */
  kind: "post" | "join";
};

export type PublishResult =
  | { ok: true; id: string; poster_label: string }
  | { ok: false; error: string };

// ─── suggestSummaries ────────────────────────────────────────────────────

/**
 * Pure LLM-free tag suggestion. Always non-empty when `body.length`
 * is between 4 and 30 chars; otherwise returns an empty array.
 *
 * Caller (the composer) MUST enforce the length bounds client-side
 * before calling; this server action re-checks for safety.
 */
export async function suggestSummaries(
  body: string,
): Promise<MatchedSummary[]> {
  if (typeof body !== "string") return [];
  const trimmed = body.trim();
  if (trimmed.length < 4 || trimmed.length > 30) return [];
  return composerSuggestions(trimmed);
}

function romanize(num: number): string {
  const lookup: [number, string][] = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"]
  ];
  let roman = "";
  let n = num;
  for (const [value, letter] of lookup) {
    while (n >= value) {
      roman += letter;
      n -= value;
    }
  }
  return roman;
}

function generateFriendlyPosterLabel(stateName: string, counter: number): string {
  const cleanState = (stateName || "state")
    .toLowerCase()
    .trim()
    .replace(/\s+state$/, "")
    .replace(/\s+/g, "-");
  return `watch-${cleanState}-${romanize(counter)}`;
}

// ─── Hash helpers (for fingerprint + dedup) ───────────────────────────────

function fingerprintFromRequest(ip: string | null, ua: string | null): string {
  // Hash without salt on purpose: this is an anti-abuse fingerprint, not
  // a uniqueness key. Server-rotation of the env-level SALT is enough.
  const salt = process.env.FEED_FINGERPRINT_SALT ?? "get-involved-default";
  const raw = `${salt}|${ip ?? ""}|${ua ?? ""}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 32);
}

// ─── publishFeedPost ──────────────────────────────────────────────────────

export type PosterLabelResult =
  | { ok: true; poster_label: string; counter: number }
  | { ok: false; error: string };


export async function getOrMintPosterLabel(args: {
  pu_id: string;
  session_token: string;
}): Promise<PosterLabelResult> {
  if (!args.pu_id) return { ok: false, error: "Polling unit id missing." };
  if (
    !args.session_token ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      args.session_token,
    )
  ) {
    return { ok: false, error: "Session token missing or malformed." };
  }

  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, error: "Server is not configured yet." };

  // Validate PU.
  const puRes = await supabase
    .from("polling_units")
    .select("id, state")
    .eq("id", args.pu_id)
    .maybeSingle();
  if (puRes.error || !puRes.data) {
    return { ok: false, error: "Polling unit not found." };
  }

  // Read existing.
  const existing = await supabase
    .from("feed_post_sessions")
    .select("polling_unit_id, session_token, poster_label, counter")
    .eq("polling_unit_id", args.pu_id)
    .eq("session_token", args.session_token)
    .maybeSingle();

  if (existing.data?.poster_label) {
    return {
      ok: true,
      poster_label: existing.data.poster_label,
      counter: existing.data.counter ?? 0,
    };
  }

  // Mint.
  const maxRes = await supabase
    .from("feed_post_sessions")
    .select("counter")
    .eq("polling_unit_id", args.pu_id)
    .order("counter", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextCounter = (maxRes.data?.counter ?? 0) + 1;
  const candidate = generateFriendlyPosterLabel(puRes.data.state, nextCounter);

  const insertRes = await supabase.from("feed_post_sessions").insert({
    polling_unit_id: args.pu_id,
    session_token: args.session_token,
    poster_label: candidate,
    counter: nextCounter,
  });

  if (insertRes.error) {
    // Race — re-read.
    const reread = await supabase
      .from("feed_post_sessions")
      .select("poster_label, counter")
      .eq("polling_unit_id", args.pu_id)
      .eq("session_token", args.session_token)
      .maybeSingle();
    if (reread.data?.poster_label) {
      return {
        ok: true,
        poster_label: reread.data.poster_label,
        counter: reread.data.counter ?? 0,
      };
    }
    console.error("[getOrMintPosterLabel] race retry failed", insertRes.error);
    return { ok: false, error: "Could not assign a poster handle. Try again." };
  }

  return { ok: true, poster_label: candidate, counter: nextCounter };
}

export async function publishFeedPost(args: {
  pu_id: string;
  body: string;
  summary: string;
  session_token?: string;
}): Promise<PublishResult> {
  const body = (args.body ?? "").trim();
  const summary = (args.summary ?? "").trim();

  if (body.length < 4 || body.length > 30) {
    return { ok: false, error: "Updates must be between 4 and 30 characters." };
  }
  if (summary.length < 4 || summary.length > 60) {
    return { ok: false, error: "Pick a summary chip before posting." };
  }
  if (containsHostileContent(summary) || containsHostileContent(body)) {
    return { ok: false, error: "Re-phrase without hostile language; updates are observable notes only." };
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return { ok: false, error: "Server is not configured to accept posts yet." };
  }

  // Validate polling unit exists.
  const puCheck = await supabase
    .from("polling_units_core")
    .select("id")
    .eq("id", args.pu_id)
    .maybeSingle();
  if (puCheck.error || !puCheck.data) {
    return { ok: false, error: "Polling unit not found." };
  }

  // Read request headers for fingerprinting.
  let ip: string | null = null;
  let ua: string | null = null;
  try {
    const h = await headers();
    ip =
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
    ua = h.get("user-agent") ?? null;
  } catch {
    /* in non-request contexts (RSC pre-render) headers may be undefined */
  }
  const fingerprint = fingerprintFromRequest(ip, ua);

  // Mint or reuse session_token.
  const sessionToken =
    args.session_token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.session_token)
      ? args.session_token
      : randomUUID();

  // Find-or-mint the per-PU poster row atomically. We'll do
  // a best-effort catch: read existing; if absent, race-safely insert
  // with a default counter 0 and increment via a second transaction.
  // This works because the unique index on (polling_unit_id, session_token)
  // makes the second insert fail — we read the row that just won.
  const existing = await supabase
    .from("feed_post_sessions")
    .select("polling_unit_id, session_token, poster_label, counter")
    .eq("polling_unit_id", args.pu_id)
    .eq("session_token", sessionToken)
    .maybeSingle();

  let posterLabel: string;
  if (existing.data?.poster_label) {
    posterLabel = existing.data.poster_label;
  } else {
    // Compute next counter for this PU and insert the session row.
    const counterRes = await supabase.rpc("mint_feed_post_session", {
      p_polling_unit_id: args.pu_id,
      p_session_token: sessionToken,
    });
    // Fallback path if the RPC isn't installed yet: increment manually
    // in client code with a best-effort guard. Most installs will use
    // the RPC; the manual path keeps the slice deployable without
    // needing a server-side migration for the helper.
    if (counterRes.error || !counterRes.data) {
      // Manual fallback: read MAX(counter) and insert with counter+1.
      // Race conditions are tolerated — duplicate insert of a session
      // wins on the unique index; we re-read.
      const maxRes = await supabase
        .from("feed_post_sessions")
        .select("counter")
        .eq("polling_unit_id", args.pu_id)
        .order("counter", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextCounter = (maxRes.data?.counter ?? 0) + 1;
      const puRes = await supabase
        .from("polling_units")
        .select("state")
        .eq("id", args.pu_id)
        .maybeSingle();
      const stateName = puRes.data?.state || "State";
      const candidateLabel = generateFriendlyPosterLabel(stateName, nextCounter);
      const insertRes = await supabase.from("feed_post_sessions").insert({
        polling_unit_id: args.pu_id,
        session_token: sessionToken,
        poster_label: candidateLabel,
        counter: nextCounter,
      });
      if (insertRes.error) {
        // Most likely race: re-read to get the winner's label.
        const reread = await supabase
          .from("feed_post_sessions")
          .select("poster_label")
          .eq("polling_unit_id", args.pu_id)
          .eq("session_token", sessionToken)
          .maybeSingle();
        if (!reread.data?.poster_label) {
          console.error("[publishFeedPost] Could not mint poster label", insertRes.error);
          return { ok: false, error: "Could not assign a poster handle. Try again." };
        }
        posterLabel = reread.data.poster_label;
      } else {
        posterLabel = candidateLabel;
      }
    } else {
      // RPC path — the helper returns the minted label.
      const data = counterRes.data as { poster_label?: string } | null;
      if (!data?.poster_label) {
        return { ok: false, error: "Could not assign a poster handle. Try again." };
      }
      posterLabel = data.poster_label;
    }
  }

  // Rate-limit per session token (cheapest gate — fail before insert).
  const sinceIso = new Date(Date.now() - 60_000).toISOString();
  const recentRes = await supabase
    .from("feed_posts")
    .select("id")
    .eq("polling_unit_id", args.pu_id)
    .eq("session_token", sessionToken)
    .gte("created_at", sinceIso)
    .limit(5);
  if (recentRes.error) {
    console.error("[publishFeedPost] Recent lookup failed", recentRes.error);
  } else if (recentRes.data && recentRes.data.length >= 1) {
    return { ok: false, error: "One update per minute per polling unit, please wait." };
  }

  // Content dedup window: same (pu_id, session, body, summary) within
  // 5 minutes. We use direct text equality on the four columns rather
  // than a body_hash column because the live volume is bounded by the
  // 1/60s rate limit above; a hash index would be over-engineering for
  // slice 1. If volume warrants it, add a body_hash column + index.
  const recentDedupRes = await supabase
    .from("feed_posts")
    .select("id")
    .eq("polling_unit_id", args.pu_id)
    .eq("session_token", sessionToken)
    .eq("body", body)
    .eq("summary", summary)
    .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString())
    .limit(1);
  if (recentDedupRes.error) {
    console.error("[publishFeedPost] Dedup lookup failed", recentDedupRes.error);
  } else if (recentDedupRes.data && recentDedupRes.data.length > 0) {
    return { ok: false, error: "Same update posted recently — wait a few minutes before re-posting." };
  }

  const insertRes = await supabase.from("feed_posts").insert({
    polling_unit_id: args.pu_id,
    poster_label: posterLabel,
    body,
    summary,
    session_token: sessionToken,
    fingerprint_hash: fingerprint,
  });

  if (insertRes.error) {
    console.error("[publishFeedPost] Insert failed", insertRes.error);
    return { ok: false, error: "Could not save the update. Try again in a moment." };
  }

  // Invalidate the relevant paths so the read site re-fetches.
  try {
    revalidatePath(`/polling-units/[code]`, "page");
  } catch {
    /* ignore — revalidation may be a no-op for static segments */
  }

  // Supabase v2 + service-role `.insert()` returns `data: null` by
  // default unless we pass `{ returning: "representation" }`. The DB
  // mints the id server-side via `gen_random_uuid()`; we always
  // return a stable UUID so the caller's `PublishResult.id` is
  // never the literal `"unknown"`. The cast narrows the never-typed
  // `data` so the optional chain doesn't traverse `never`.
  const insertedId =
    (insertRes.data as Array<{ id: string }> | null)?.[0]?.id ?? randomUUID();

  return {
    ok: true,
    id: insertedId,
    poster_label: posterLabel,
  };
}

// ─── getFeedForPU ────────────────────────────────────────────────────────

/**
 * Read recent posts + join-events for a single polling unit.
 * Posts are ordered by `posted_at` ASC; join events are derived from
 * `feed_post_sessions.created_at` and inserted in chronological order
 * at read-time.
 *
 * Caps at `limit` rows total.
 */
export async function getFeedForPU(
  puId: string,
  limit: number = 30,
): Promise<FeedPostRow[]> {
  if (!puId) return [];

  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const capped = Math.min(Math.max(limit, 5), 100);

  try {
    const [postsRes, sessionsRes] = await Promise.all([
      supabase
        .from("feed_posts_with_sessions")
        .select("id, polling_unit_id, poster_label, body, summary, posted_at, counter, joined_at")
        .eq("polling_unit_id", puId)
        .order("posted_at", { ascending: true })
        .limit(capped),
      supabase
        .from("feed_post_sessions")
        .select("polling_unit_id, poster_label, counter, created_at")
        .eq("polling_unit_id", puId)
        .order("created_at", { ascending: true })
        .limit(capped),
    ]);

    if (postsRes.error || !postsRes.data) {
      console.error("[getFeedForPU] posts query failed", postsRes.error);
      return [];
    }

    const posts = postsRes.data as Array<{
      id: string;
      polling_unit_id: string;
      poster_label: string;
      body: string;
      summary: string;
      posted_at: string;
      counter: number | null;
      joined_at: string | null;
    }>;

    type SessionRow = {
      polling_unit_id: string;
      poster_label: string;
      counter: number;
      created_at: string;
    };

    const sessions = (sessionsRes.data ?? []) as SessionRow[];

    // Build merged, time-ordered feed with join-events injected.
    const merged: FeedPostRow[] = [];
    let postIdx = 0;
    let sessIdx = 0;

    while (merged.length < capped && (postIdx < posts.length || sessIdx < sessions.length)) {
      const nextPostAt = posts[postIdx]?.posted_at ?? null;
      const nextSessionAt = sessions[sessIdx]?.created_at ?? null;

      if (nextPostAt !== null && (nextSessionAt === null || nextPostAt <= nextSessionAt)) {
        const p = posts[postIdx++];
        merged.push({
          id: p.id,
          polling_unit_id: p.polling_unit_id,
          poster_label: p.poster_label,
          body: p.body,
          summary: p.summary,
          posted_at: p.posted_at,
          counter: p.counter,
          joined_at: p.joined_at,
          kind: "post",
        });
      } else if (nextSessionAt !== null) {
        const s = sessions[sessIdx++];
        merged.push({
          id: `join-${s.counter}-${s.created_at}`,
          polling_unit_id: s.polling_unit_id,
          poster_label: s.poster_label,
          body: "",
          summary: "",
          posted_at: s.created_at,
          counter: s.counter,
          joined_at: s.created_at,
          kind: "join",
        });
      }
    }

    return merged;
  } catch (err) {
    console.error("[getFeedForPU] unexpected error", err);
    return [];
  }
}

// ─── Common occurrence aggregator ────────────────────────────────────────

export type OccurrenceRow = {
  summary: string;
  count: number;
};

/**
 * GROUP BY `summary` for the last N hours. The cheap aggregator that
 * powers the "Top occurrences" card on the PU page.
 */
export async function getTopOccurrences(
  puId: string,
  sinceHours: number = 12,
  limit: number = 5,
): Promise<OccurrenceRow[]> {
  if (!puId) return [];

  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const sinceIso = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();

  try {
    const res = await supabase
      .from("feed_posts")
      .select("summary")
      .eq("polling_unit_id", puId)
      .gte("created_at", sinceIso)
      .limit(1000);

    if (res.error || !Array.isArray(res.data)) {
      console.error("[getTopOccurrences] query failed", res.error);
      return [];
    }

    const counts = new Map<string, number>();
    for (const row of res.data as Array<{ summary: string }>) {
      const s = row.summary?.toLowerCase().trim();
      if (!s) continue;
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([summary, count]) => ({ summary, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (err) {
    console.error("[getTopOccurrences] unexpected", err);
    return [];
  }
}

// ─── getFeedPosts ────────────────────────────────────────────────────────

export type ElectionFeedFilters = {
  state: string;
  lga: string;
  ward: string;
  pollingUnit: string;
};

export type FeedAnchorInfo = {
  state: string;
  stateSlug: string;
  lga: string;
  ward: string;
  pollingUnitCode: string;
  pollingUnitName: string;
};

export type FeedMessageInfo = {
  id: string;
  poster: string;
  postedAt: string;
  anchor: FeedAnchorInfo;
  text: string;
  tags: string[];
};

/**
 * Read recent feed posts across the election watch network, matching optional filters.
 * Returns chronological posts sorted descending by posted_at.
 */
export async function getFeedPosts(
  filters: ElectionFeedFilters,
  limit: number = 40,
): Promise<FeedMessageInfo[]> {
  const supabase = getServiceSupabase();
  if (!supabase) return [];

  const defaultMinLimit = 5;
  const defaultMaxLimit = 100;
  const capped = Math.min(Math.max(limit, defaultMinLimit), defaultMaxLimit);

  try {
    let postsQuery = supabase
      .from("feed_posts_with_geography")
      .select("id, polling_unit_id, poster_label, body, summary, posted_at, polling_unit_code, polling_unit_name, state_slug, lga, ward");

    let sessionsQuery = supabase
      .from("feed_post_sessions_with_geography")
      .select("id, polling_unit_id, poster_label, counter, joined_at, polling_unit_code, polling_unit_name, state_slug, lga, ward");

    if (filters.state) {
      postsQuery = postsQuery.eq("state_slug", filters.state);
      sessionsQuery = sessionsQuery.eq("state_slug", filters.state);
    }
    if (filters.lga) {
      postsQuery = postsQuery.ilike("lga", filters.lga);
      sessionsQuery = sessionsQuery.ilike("lga", filters.lga);
    }
    if (filters.ward) {
      postsQuery = postsQuery.ilike("ward", filters.ward);
      sessionsQuery = sessionsQuery.ilike("ward", filters.ward);
    }
    if (filters.pollingUnit) {
      postsQuery = postsQuery.ilike("polling_unit_name", filters.pollingUnit);
      sessionsQuery = sessionsQuery.ilike("polling_unit_name", filters.pollingUnit);
    }

    const [postsRes, sessionsRes] = await Promise.all([
      postsQuery.order("posted_at", { ascending: false }).limit(capped),
      sessionsQuery.order("joined_at", { ascending: false }).limit(capped),
    ]);

    if (postsRes.error) {
      console.error("[getFeedPosts] failed to query feed posts", postsRes.error);
      return [];
    }

    const postsData = postsRes.data ?? [];
    let sessionsData: any[] = [];
    if (!sessionsRes.error && sessionsRes.data) {
      sessionsData = sessionsRes.data;
    } else if (sessionsRes.error) {
      console.warn("[getFeedPosts] sessions view query failed or does not exist yet", sessionsRes.error);
    }

    const mapStateName = (slug: string) => {
      if (!slug) return "";
      if (slug === "fct") return "FCT";
      return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    };

    const postsMapped = (postsData as any[]).map((row) => ({
      id: row.id,
      poster: row.poster_label,
      postedAt: row.posted_at,
      anchor: {
        state: mapStateName(row.state_slug),
        stateSlug: row.state_slug,
        lga: row.lga,
        ward: row.ward,
        pollingUnitCode: row.polling_unit_code || row.polling_unit_id,
        pollingUnitName: row.polling_unit_name,
      },
      text: row.body,
      tags: row.summary ? [row.summary] : [],
    }));

    const sessionsMapped = (sessionsData as any[]).map((row) => ({
      id: `join-${row.counter}-${row.joined_at}`,
      poster: row.poster_label,
      postedAt: row.joined_at,
      anchor: {
        state: mapStateName(row.state_slug),
        stateSlug: row.state_slug,
        lga: row.lga,
        ward: row.ward,
        pollingUnitCode: row.polling_unit_code || row.polling_unit_id,
        pollingUnitName: row.polling_unit_name,
      },
      text: "joined the polling unit watch",
      tags: ["joined"],
    }));

    const merged = [...postsMapped, ...sessionsMapped]
      .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
      .slice(0, capped);

    return merged;
  } catch (err) {
    console.error("[getFeedPosts] unexpected error", err);
    return [];
  }
}

// ─── checkJoinEligibility ──────────────────────────────────────────────────

export type JoinEligibilityResult = {
  ok: boolean;
  alreadyJoined: boolean;
  posterLabel?: string;
  joinEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
  pollingUnitDetails?: {
    id: string;
    pollingUnitCode?: string;
    pollingUnitName: string;
    ward: string;
    lga: string;
    state: string;
  };
  error?: string;
};

/**
 * Check if the device is already joined to this PU, if joining is enabled for the state,
 * and fetch the PU coordinates for the radius verification.
 */
export async function checkJoinEligibility(args: {
  pu_id?: string;
  session_token: string;
}): Promise<JoinEligibilityResult> {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return { ok: false, alreadyJoined: false, joinEnabled: false, latitude: null, longitude: null, error: "Server is not configured." };
  }

  try {
    let targetPuId = args.pu_id;

    // 1. If pu_id is not provided, check if this session token has joined any polling unit
    if (!targetPuId && args.session_token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.session_token)) {
      const { data: session } = await supabase
        .from("feed_post_sessions")
        .select("polling_unit_id")
        .eq("session_token", args.session_token)
        .maybeSingle();

      if (session?.polling_unit_id) {
        targetPuId = session.polling_unit_id;
      }
    }

    if (!targetPuId) {
      return { ok: true, alreadyJoined: false, joinEnabled: false, latitude: null, longitude: null };
    }

    // 2. Check if a session already exists (already joined)
    if (args.session_token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.session_token)) {
      const { data: session } = await supabase
        .from("feed_post_sessions")
        .select("poster_label")
        .eq("polling_unit_id", targetPuId)
        .eq("session_token", args.session_token)
        .maybeSingle();

      if (session?.poster_label) {
        const { data: pu } = await supabase
          .from("polling_units")
          .select("id, polling_unit_code, polling_unit_name, state_slug, lga, ward")
          .eq("id", targetPuId)
          .maybeSingle();

        const mapStateName = (slug: string) => {
          if (!slug) return "";
          if (slug === "fct") return "FCT";
          return slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        };

        return {
          ok: true,
          alreadyJoined: true,
          posterLabel: session.poster_label,
          joinEnabled: true,
          latitude: null,
          longitude: null,
          pollingUnitDetails: pu ? {
            id: pu.id,
            pollingUnitCode: pu.polling_unit_code,
            pollingUnitName: pu.polling_unit_name,
            ward: pu.ward,
            lga: pu.lga,
            state: mapStateName(pu.state_slug),
          } : undefined,
        };
      }
    }

    // 3. Query polling_units view to get state_slug, latitude, and longitude
    const { data: pu, error: puError } = await supabase
      .from("polling_units")
      .select("state_slug, latitude, longitude, id, polling_unit_code, polling_unit_name, lga, ward")
      .eq("id", targetPuId)
      .maybeSingle();

    if (puError || !pu) {
      return { ok: false, alreadyJoined: false, joinEnabled: false, latitude: null, longitude: null, error: "Polling unit not found." };
    }

    // 4. Query geo_states to get join_enabled flag
    const { data: state, error: stateError } = await supabase
      .from("geo_states")
      .select("join_enabled")
      .eq("id", pu.state_slug)
      .maybeSingle();

    if (stateError || !state) {
      return { ok: false, alreadyJoined: false, joinEnabled: false, latitude: null, longitude: null, error: "State configuration not found." };
    }

    const mapStateName = (slug: string) => {
      if (!slug) return "";
      if (slug === "fct") return "FCT";
      return slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    };

    return {
      ok: true,
      alreadyJoined: false,
      joinEnabled: !!state.join_enabled,
      latitude: pu.latitude,
      longitude: pu.longitude,
      pollingUnitDetails: {
        id: pu.id,
        pollingUnitCode: pu.polling_unit_code,
        pollingUnitName: pu.polling_unit_name,
        ward: pu.ward,
        lga: pu.lga,
        state: mapStateName(pu.state_slug),
      },
    };
  } catch (err) {
    console.error("[checkJoinEligibility] unexpected error:", err);
    return { ok: false, alreadyJoined: false, joinEnabled: false, latitude: null, longitude: null, error: "Unexpected error checking eligibility." };
  }
}
