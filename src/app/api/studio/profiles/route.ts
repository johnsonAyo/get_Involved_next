import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";

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

// GET /api/studio/profiles
export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .order("full_name", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/studio/profiles
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const fullName = body.full_name || "Unknown";
  const slug = slugify(fullName);

  const row = {
    full_name: fullName,
    slug,
    profile_picture_url: body.profile_picture_url ?? null,
    age: body.age ? Number(body.age) : null,
    contact_email: body.contact_email ?? null,
    contact_phone: body.contact_phone ?? null,
    bio: body.bio ?? null,
    state_of_origin: body.state_of_origin ?? null,
    profile_url: body.profile_url ?? "",
    links: Array.isArray(body.links) ? body.links : [],
    current_party_id: body.current_party_id ?? null,
    latest_election_year: body.latest_election_year ? Number(body.latest_election_year) : null,
    last_known_position: body.last_known_position ?? null,
    party_history: [],
    office_history: [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profile")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("candidates", "max");

  return NextResponse.json(data, { status: 201 });
}
