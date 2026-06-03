import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
}

// GET /api/studio/profiles/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT /api/studio/profiles/[id]
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();

  const row = {
    full_name: body.full_name || "Unknown",
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
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profile")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE /api/studio/profiles/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("profile").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
