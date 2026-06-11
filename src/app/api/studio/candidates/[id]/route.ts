import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
}

type RouteParams = { params: Promise<{ id: string }> };

// ─── GET /api/studio/candidates/[id] ─────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select('*')
    .eq("id", id)
    .single();

  if (!candidate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch related data manually
  const { data: profile } = await supabase.from("profile").select("*").eq("id", candidate.profile_id).maybeSingle();
  const { data: party } = await supabase.from("parties").select("*").eq("id", candidate.party_id).maybeSingle();

  const enrichedData = {
    ...candidate,
    profile: profile || null,
    party: party || null
  };

  return NextResponse.json(enrichedData);
}

// ─── PUT /api/studio/candidates/[id] ─────────────────────────────────────────
// Body carries candidacy fields.
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();

  if (!body.profile_id) {
    return NextResponse.json({ error: "profile_id is required" }, { status: 400 });
  }

  // ── 1. Update candidate (electoral run details) ──
  const { data, error: candidateError } = await supabase
    .from("candidates")
    .update({
      profile_id: body.profile_id,
      year: body.year ?? null,
      position: body.position ?? "",
      party_id: body.party_id ?? null,
      state_id: body.state_id ?? "",
      lga: body.lga ?? "",
      vice_candidate_name: body.vice_candidate_name ?? "",
      display: body.display !== false,
      source: Array.isArray(body.source) ? body.source : [],
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (candidateError) {
    return NextResponse.json({ error: candidateError.message }, { status: 500 });
  }

  // ── 2. Refresh profile snapshot fields ──
  await supabase
    .from("profile")
    .update({
      latest_election_year: body.year ?? null,
      last_known_position: body.position ?? null,
    })
    .eq("id", body.profile_id);

  return NextResponse.json(data);
}

// ─── DELETE /api/studio/candidates/[id] ──────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("candidates").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
