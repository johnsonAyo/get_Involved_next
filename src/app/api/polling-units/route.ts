import { NextRequest, NextResponse } from "next/server";
import { getPollingUnits } from "@/lib/content-store.server";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const pageParam = searchParams.get("page");
  const result = await getPollingUnits({
    query: searchParams.get("query") || "",
    state: searchParams.get("state") || "",
    lga: searchParams.get("lga") || "",
    ward: searchParams.get("ward") || "",
    cursor: searchParams.get("cursor") || "",
    direction: searchParams.get("direction") === "prev" ? "prev" : "next",
    page: pageParam ? parseInt(pageParam, 10) : 1,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
