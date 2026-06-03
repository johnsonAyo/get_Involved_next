import { NextResponse } from "next/server";
import {
  fetchSanityOperation,
  hasServerSanityConfig,
} from "../../../../server/sanity-read.js";

export async function POST(request: Request) {
  if (!hasServerSanityConfig()) {
    return NextResponse.json(
      { error: "Sanity is not configured for this environment." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const operation =
      body && typeof body.operation === "string" ? body.operation : "";
    const params = body && typeof body.params === "object" ? body.params : {};

    if (!operation) {
      return NextResponse.json(
        { error: "Missing Sanity operation." },
        { status: 400 },
      );
    }

    const data = await fetchSanityOperation(operation, params);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown Sanity API error.",
      },
      { status: 500 },
    );
  }
}
