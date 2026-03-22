import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Storage backend
// ---------------------------------------------------------------------------
// If Upstash credentials are available, use Redis for accurate cross-instance
// rate limiting. Otherwise, fall back to an ephemeral in-memory store (useful
// for local dev but unreliable in production serverless environments).
// ---------------------------------------------------------------------------

function createStore(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    return new Redis({ url, token });
  }

  return null;
}

const store = createStore();

// ---------------------------------------------------------------------------
// Rate limiters (only created when Redis is available)
// ---------------------------------------------------------------------------

/** Auth routes: 100 requests per 60-second sliding window. */
export const authLimiter = store
  ? new Ratelimit({
      redis: store,
      limiter: Ratelimit.slidingWindow(100, "60 s"),
      analytics: false,
      prefix: "ratelimit:auth",
    })
  : null;

/** General API routes: 60 requests per 60-second sliding window. */
export const apiLimiter = store
  ? new Ratelimit({
      redis: store,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: false,
      prefix: "ratelimit:api",
    })
  : null;

// ---------------------------------------------------------------------------
// Routes exempt from rate limiting (cron jobs, OAuth callbacks, webhooks).
// ---------------------------------------------------------------------------

const EXEMPT_PREFIXES = [
  "/api/automation/run",
  "/api/inbox/oauth/gmail/callback",
  "/api/integrations/square/oauth/callback",
];

export function isExemptRoute(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Core check function
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window. */
  remaining: number;
  /** Unix ms timestamp when the window resets. */
  reset: number;
  /** Seconds until the window resets (for Retry-After header). */
  retryAfterSeconds: number;
}

/**
 * Check the rate limit for a given request.
 *
 * When Redis is not configured the check is a no-op (always allowed) so that
 * local development isn't blocked.
 *
 * @param identifier - User ID or IP address.
 * @param pathname   - The API route path (used to select the correct limiter).
 */
export async function checkRateLimit(
  identifier: string,
  pathname: string,
): Promise<RateLimitResult> {
  const limiter = pathname.startsWith("/api/auth/") ? authLimiter : apiLimiter;

  // No Redis configured – allow everything (local dev).
  if (!limiter) {
    return { allowed: true, remaining: -1, reset: 0, retryAfterSeconds: 0 };
  }

  const { success, remaining, reset } = await limiter.limit(identifier);

  const retryAfterSeconds = Math.max(
    0,
    Math.ceil((reset - Date.now()) / 1000),
  );

  return {
    allowed: success,
    remaining,
    reset,
    retryAfterSeconds,
  };
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Standard rate-limit headers to attach to every API response so clients can
 * monitor their remaining budget.
 */
export function rateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}

/**
 * Build a 429 "Too Many Requests" response with the required Retry-After
 * header and a JSON body describing the error.
 */
export function rateLimitExceededResponse(
  result: RateLimitResult,
): NextResponse {
  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      retryAfter: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": result.retryAfterSeconds.toString(),
        ...rateLimitHeaders(result),
      },
    },
  );
}

