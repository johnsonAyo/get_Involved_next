import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
}

// GET /api/studio/parties
export async function GET() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/studio/parties
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const id =
    body.id ||
    String(body.abbreviation || body.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) ||
    `party-${Date.now()}`;

  const row = {
    id,
    name: body.name || "",
    abbreviation: body.abbreviation || "",
    logo: body.logo || "",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("parties")
    .insert(row)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
