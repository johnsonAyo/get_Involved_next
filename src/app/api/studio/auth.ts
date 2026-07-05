import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

/**
 * Verifies that the request includes a valid Supabase auth token.
 * Use as a guard at the top of API route handlers.
 *
 * @returns null if auth is valid, or a Response that should be returned immediately.
 */
export async function requireAuth(
  request: Request,
): Promise<Response | null> {
  if (!supabaseUrl || !supabaseSecret) {
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const token = authHeader.slice(7);
  const supabase = createClient(supabaseUrl, supabaseSecret);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized." }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  return null; // auth successful
}
