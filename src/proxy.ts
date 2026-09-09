import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Block empty UA and obvious attack/scraper tools.
 * Do NOT block Googlebot, Bingbot, or social preview bots (SEO).
 */
function isBlockedUserAgent(request: NextRequest): boolean {
  const ua = (request.headers.get("user-agent") || "").trim().toLowerCase();
  if (!ua) return true;

  return (
    ua.includes("scrapy") ||
    ua.includes("python-requests") ||
    ua.includes("httpclient") ||
    ua.includes("libwww") ||
    ua.includes("zgrab") ||
    ua.includes("masscan") ||
    ua.includes("nikto") ||
    ua.includes("sqlmap") ||
    ua.includes("nmap") ||
    ua.startsWith("go-http-client") ||
    ua.startsWith("java/") ||
    ua.startsWith("axios/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Studio/auth routes need the Supabase session refresh.
  if (pathname.startsWith("/studio") || pathname.startsWith("/api/studio")) {
    return updateSession(request);
  }

  // Expensive public catalog paths: short-circuit clear scrapers only.
  // Good traffic gets NextResponse.next() with no cookie rewrite so ISR stays intact.
  if (isBlockedUserAgent(request)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/studio/:path*",
    "/api/studio/:path*",
    "/polling-units",
    "/polling-units/:path*",
    "/candidates",
    "/candidates/:path*",
    "/search",
    "/states",
    "/states/:path*",
  ],
};
