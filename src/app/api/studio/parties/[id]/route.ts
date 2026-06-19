import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
}

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/studio/parties/[id]
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PUT /api/studio/parties/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("parties")
    .update({
      name: body.name,
      abbreviation: body.abbreviation,
      logo: body.logo ?? "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("parties", "max");
  revalidateTag("candidates", "max");

  return NextResponse.json(data);
}

// DELETE /api/studio/parties/[id]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("parties").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateTag("parties", "max");
  revalidateTag("candidates", "max");

  return NextResponse.json({ success: true });
}
