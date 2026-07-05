/**
 * Environment variable validation.
 * Fails fast at module evaluation time if required vars are missing.
 * Import this early (layout.tsx, middleware) to catch misconfiguration at startup.
 */

const REQUIRED_SERVER_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

const missing: string[] = [];

for (const key of REQUIRED_SERVER_VARS) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  const message =
    `❌ Missing required environment variables:\n` +
    missing.map((v) => `   • ${v}`).join("\n") +
    `\n\nAdd them to your .env.local file and restart the server.`;

  throw new Error(message);
}

/** Checked once at import time — safe to re-export for consumers. */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;
export const FORMS_API_URL = process.env.NEXT_PUBLIC_FORMS_API_URL;
export const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
