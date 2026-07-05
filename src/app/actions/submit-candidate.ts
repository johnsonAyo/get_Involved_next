"use server";

import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import type { CandidateSubmission } from "@/types/domain";

// ─── Rate Limiter ───────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_SUBMISSIONS_PER_WINDOW = 5;

const rateLimitMap = new Map<
  string,
  { count: number; windowStart: number }
>();

function checkRateLimit(headers: Headers): void {
  const now = Date.now();
  // Use x-forwarded-for or a fallback for per-IP rate limiting.
  // Falls back to "unknown" in dev/localhost where headers may be absent.
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = `submission:${ip}`;

  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return;
  }

  if (entry.count >= MAX_SUBMISSIONS_PER_WINDOW) {
    throw new Error(
      "Too many submissions. Please wait a moment before trying again.",
    );
  }

  entry.count++;
}

// ─── Input Sanitization ─────────────────────────────────────────────────────

function sanitizeString(value: string, maxLength = 500): string {
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // strip angle brackets to prevent HTML injection
}

function sanitizeUrl(value: string): string {
  const trimmed = value.trim();
  // Only allow http/https URLs
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    throw new Error("Source URL must start with https://");
  }
  return trimmed.slice(0, 2000);
}

function sanitizeSubmission(
  data: CandidateSubmission,
): CandidateSubmission {
  return {
    website: data.website, // honeypot — passed through as-is
    candidate: sanitizeString(data.candidate, 300),
    position: sanitizeString(data.position, 200),
    party: sanitizeString(data.party, 100),
    state: sanitizeString(data.state, 100),
    localGovernment: sanitizeString(data.localGovernment, 200),
    source: sanitizeString(data.source, 500),
    sourceUrl: sanitizeUrl(data.sourceUrl),
  };
}

// ─── Server Action ──────────────────────────────────────────────────────────

export async function submitCandidateApplication(data: CandidateSubmission) {
  // 0. Honeypot check — if the hidden field is filled, silently reject
  if (data.website && data.website.trim().length > 0) {
    console.warn("Honeypot triggered — rejecting spam submission");
    return { success: true };
  }

  // 1. Rate limit
  const requestHeaders = await headers();
  checkRateLimit(requestHeaders);

  // 2. Sanitize inputs
  const sanitized = sanitizeSubmission(data);

  // 3. Validate required fields server-side
  if (!sanitized.candidate) {
    throw new Error("Candidate name is required.");
  }
  if (!sanitized.position) {
    throw new Error("Position is required.");
  }
  if (!sanitized.party) {
    throw new Error("Party is required.");
  }
  if (!sanitized.sourceUrl) {
    throw new Error("Source URL is required.");
  }

  // 4. Insert into Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from("candidate_applications").insert({
      website: sanitized.website,
      candidate_name: sanitized.candidate,
      position: sanitized.position,
      party: sanitized.party,
      state: sanitized.state,
      local_government: sanitized.localGovernment,
      source: sanitized.source,
      source_url: sanitized.sourceUrl,
    });

    if (error) {
      console.error("Failed to insert candidate application into Supabase:", error);
      throw new Error("Failed to save application to the database.");
    }
  } else {
    console.warn("Supabase credentials missing. Skipping DB insert for candidate submission.");
  }

  // 5. Fire existing Webhook
  const webhookUrl = process.env.NEXT_PUBLIC_FORMS_API_URL;
  if (!webhookUrl) {
    console.warn("NEXT_PUBLIC_FORMS_API_URL not set - skipping webhook for candidate submission.");
    return { success: true };
  }

  const resp = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(sanitized),
  });

  if (!resp.ok) {
    let errorMessage = `Submission failed: ${resp.status} ${resp.statusText}`;
    try {
      const text = await resp.clone().text();
      const errorData = JSON.parse(text);
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.errors?.[0]?.message) {
        errorMessage = errorData.errors[0].message;
      } else if (text) {
        errorMessage = text;
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return { success: true };
}
