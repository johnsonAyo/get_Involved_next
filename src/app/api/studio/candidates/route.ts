import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
}

function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 96);
}

// ─── GET /api/studio/candidates ───────────────────────────────────────────────
// Returns candidate rows joined with profile (person details) and parties.
export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  // Fetch candidates with profile and party joined
  let query = supabase
    .from("candidates")
    .select('*')
    .order("year", { ascending: false, nullsFirst: false });

  const position = searchParams.get("position");
  const partyId = searchParams.get("party_id");
  const year = searchParams.get("year");
  const stateId = searchParams.get("state_id");
  const search = searchParams.get("search");
  const displayOnly = searchParams.get("display");

  if (position) query = query.eq("position", position);
  if (partyId) query = query.eq("party_id", partyId);
  if (year) query = query.eq("year", Number(year));
  if (stateId) query = query.eq("state_id", stateId);
  if (displayOnly === "true") query = query.eq("display", true);
  if (search) {
    // Search on joined profile.full_name requires a text filter workaround —
    // we fetch all and filter in-memory for the studio (manageable dataset).
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch related data manually to avoid schema cache/foreign key issues
  const { data: profilesData } = await supabase.from("profile").select("*");
  const { data: partiesData } = await supabase.from("parties").select("*");

  const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
  const partiesMap = new Map((partiesData || []).map(p => [p.id, p]));

  const enrichedData = (data || []).map((candidate: any) => ({
    ...candidate,
    profile: candidate.profile_id ? profilesMap.get(candidate.profile_id) || null : null,
    party: candidate.party_id ? partiesMap.get(candidate.party_id) || null : null
  }));

  // Apply name search in memory (studio only, not public API)
  const filtered =
    search
      ? enrichedData.filter((row: any) =>
          row.profile?.full_name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          row.position?.toLowerCase().includes(search.toLowerCase()) ||
          row.party?.abbreviation
            ?.toLowerCase()
            .includes(search.toLowerCase()),
        )
      : enrichedData;

  return NextResponse.json(filtered);
}

// ─── POST /api/studio/candidates ─────────────────────────────────────────────
// Body shape:
//   candidateFields: { profile_id, year, position_id, position, position_sort_order,
//                      party_id, state_id, lga, vice_candidate_name, display, source }
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  if (!body.profile_id) {
    return NextResponse.json({ error: "profile_id is required" }, { status: 400 });
  }

  // ── 1. Candidate row ──
  const candidateId = `studio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const candidateRow = {
    id: candidateId,
    profile_id: body.profile_id,
    year: body.year ?? null,
    position_id: body.position_id ?? null,
    position: body.position ?? "",
    position_sort_order: body.position_sort_order ?? null,
    party_id: body.party_id ?? null,
    state_id: body.state_id ?? "",
    lga: body.lga ?? "",
    vice_candidate_name: body.vice_candidate_name ?? "",
    display: body.display !== false,
    source: Array.isArray(body.source) ? body.source : [],
    payload: body,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("candidates")
    .insert(candidateRow)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── 2. Update profile snapshot ──
  await supabase.from("profile").update({
    latest_election_year: body.year ?? null,
    last_known_position: body.position ?? null,
  }).eq("id", body.profile_id);

  return NextResponse.json(data, { status: 201 });
}
