import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;
const STORAGE_BUCKET = "cms-assets";

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
}

// POST /api/studio/upload
// Accepts multipart/form-data with a "file" field.
// Returns { url: string } — the public URL of the uploaded asset.
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ]);

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json(
      { error: "Only image files are allowed (jpeg, png, webp, gif, svg)." },
      { status: 400 },
    );
  }

  const maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxFileSizeBytes) {
    return NextResponse.json(
      { error: "File exceeds the 5 MB size limit." },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop() ?? "bin";
  const uniquePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(uniquePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(uniquePath);

  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
}
