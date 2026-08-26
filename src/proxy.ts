import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const CLEANUP_EVERY = 120;

type Bucket = { count: number; resetAt: number };

// Module-level state survives across requests on a warm isolate. Not
// globally shared across serverless instances, but Hobby runs few warm
// isolates, so this caps per-instance burst crawling effectively.
const buckets = new Map<string, Bucket>();
let requestCounter = 0;

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function isBlockedUserAgent(request: NextRequest): boolean {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  return (
    ua === "" ||
    ua.includes("scrapy") ||
    ua.includes("python-requests") ||
    ua.includes("curl/") ||
    ua.includes("wget") ||
    ua.includes("httpclient") ||
    ua.includes("axios/") ||
    ua.includes("go-http-client") ||
    ua.includes("java/") ||
    ua.includes("libwww") ||
    ua.includes("zgrab") ||
    ua.includes("masscan") ||
    ua.includes("nikto")
  );
}

function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  if (++requestCounter % CLEANUP_EVERY === 0) {
    for (const [k, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfter: 0 };
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBlockedUserAgent(request)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (pathname.startsWith("/polling-units")) {
    const verdict = rateLimit(`pu:${clientIp(request)}`);
    if (!verdict.allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "retry-after": String(verdict.retryAfter),
          "content-type": "text/plain",
        },
      });
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/studio/:path*", "/polling-units/:path*"],
};
