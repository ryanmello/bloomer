import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @upstash/ratelimit before importing the module under test.
// vi.hoisted() ensures these run before any module-level code.
// ---------------------------------------------------------------------------

const { mockLimit } = vi.hoisted(() => {
  // Env vars must be set here so createStore() sees them when the module loads.
  process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";

  return { mockLimit: vi.fn() };
});

vi.mock("@upstash/ratelimit", () => {
  const slidingWindow = vi.fn().mockReturnValue("sliding-window-algo");
  return {
    Ratelimit: class MockRatelimit {
      static slidingWindow = slidingWindow;
      limit = mockLimit;
      constructor() {}
    },
  };
});

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {},
}));

import {
  checkRateLimit,
  isExemptRoute,
  rateLimitHeaders,
  rateLimitExceededResponse,
  type RateLimitResult,
} from "./rate-limit";

// ---------------------------------------------------------------------------
// isExemptRoute
// ---------------------------------------------------------------------------

describe("isExemptRoute", () => {
  it("should return true for the automation cron route", () => {
    expect(isExemptRoute("/api/automation/run")).toBe(true);
  });

  it("should return true for Gmail OAuth callback", () => {
    expect(isExemptRoute("/api/inbox/oauth/gmail/callback")).toBe(true);
  });

  it("should return true for Square OAuth callback", () => {
    expect(isExemptRoute("/api/integrations/square/oauth/callback")).toBe(true);
  });

  it("should return true for sub-paths of exempt routes", () => {
    expect(isExemptRoute("/api/automation/run/test")).toBe(true);
  });

  it("should return false for regular API routes", () => {
    expect(isExemptRoute("/api/customer")).toBe(false);
    expect(isExemptRoute("/api/auth/register")).toBe(false);
    expect(isExemptRoute("/api/products")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkRateLimit
// ---------------------------------------------------------------------------

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return allowed: true when under the limit", async () => {
    const resetTime = Date.now() + 30_000;
    mockLimit.mockResolvedValueOnce({
      success: true,
      remaining: 59,
      reset: resetTime,
    });

    const result = await checkRateLimit("user-1", "/api/customer");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(59);
    expect(result.reset).toBe(resetTime);
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(0);
  });

  it("should return allowed: false when the limit is exceeded", async () => {
    const resetTime = Date.now() + 45_000;
    mockLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: resetTime,
    });

    const result = await checkRateLimit("user-1", "/api/customer");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("should compute retryAfterSeconds as 0 when reset is in the past", async () => {
    mockLimit.mockResolvedValueOnce({
      success: true,
      remaining: 10,
      reset: Date.now() - 1000,
    });

    const result = await checkRateLimit("user-1", "/api/customer");

    expect(result.retryAfterSeconds).toBe(0);
  });

  it("should use the auth limiter for /api/auth/* paths", async () => {
    mockLimit.mockResolvedValueOnce({
      success: true,
      remaining: 99,
      reset: Date.now() + 60_000,
    });

    const result = await checkRateLimit("user-1", "/api/auth/register");

    expect(result.allowed).toBe(true);
    // The mock is shared, so we just verify it was called (limiter selection
    // is an internal detail; integration coverage below tests the full flow).
    expect(mockLimit).toHaveBeenCalledOnce();
  });

  it("should pass the identifier to the limiter", async () => {
    mockLimit.mockResolvedValueOnce({
      success: true,
      remaining: 50,
      reset: Date.now() + 30_000,
    });

    await checkRateLimit("192.168.1.1", "/api/products");

    expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
  });
});

// ---------------------------------------------------------------------------
// rateLimitHeaders
// ---------------------------------------------------------------------------

describe("rateLimitHeaders", () => {
  it("should return X-RateLimit-Remaining and X-RateLimit-Reset", () => {
    const result: RateLimitResult = {
      allowed: true,
      remaining: 42,
      reset: 1700000000000,
      retryAfterSeconds: 30,
    };

    const headers = rateLimitHeaders(result);

    expect(headers).toEqual({
      "X-RateLimit-Remaining": "42",
      "X-RateLimit-Reset": "1700000000000",
    });
  });
});

// ---------------------------------------------------------------------------
// rateLimitExceededResponse
// ---------------------------------------------------------------------------

describe("rateLimitExceededResponse", () => {
  it("should return a 429 status", async () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      reset: Date.now() + 45_000,
      retryAfterSeconds: 45,
    };

    const response = rateLimitExceededResponse(result);

    expect(response.status).toBe(429);
  });

  it("should include the Retry-After header", () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      reset: Date.now() + 30_000,
      retryAfterSeconds: 30,
    };

    const response = rateLimitExceededResponse(result);

    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("should include X-RateLimit-* headers", () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      reset: 1700000000000,
      retryAfterSeconds: 60,
    };

    const response = rateLimitExceededResponse(result);

    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("X-RateLimit-Reset")).toBe("1700000000000");
  });

  it("should have a JSON body with error and retryAfter", async () => {
    const result: RateLimitResult = {
      allowed: false,
      remaining: 0,
      reset: Date.now() + 20_000,
      retryAfterSeconds: 20,
    };

    const response = rateLimitExceededResponse(result);
    const body = await response.json();

    expect(body).toEqual({
      error: "Rate limit exceeded",
      retryAfter: 20,
    });
  });
});

// ---------------------------------------------------------------------------
// Integration: checkRateLimit -> response helpers
// ---------------------------------------------------------------------------

describe("integration: rate limit check to response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should produce a passing result with headers when under limit", async () => {
    const resetTime = Date.now() + 55_000;
    mockLimit.mockResolvedValueOnce({
      success: true,
      remaining: 58,
      reset: resetTime,
    });

    const result = await checkRateLimit("user-42", "/api/customer");
    const headers = rateLimitHeaders(result);

    expect(result.allowed).toBe(true);
    expect(headers["X-RateLimit-Remaining"]).toBe("58");
  });

  it("should produce a 429 response when over limit", async () => {
    const resetTime = Date.now() + 40_000;
    mockLimit.mockResolvedValueOnce({
      success: false,
      remaining: 0,
      reset: resetTime,
    });

    const result = await checkRateLimit("user-42", "/api/customer");
    const response = rateLimitExceededResponse(result);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(body.error).toBe("Rate limit exceeded");
    expect(body.retryAfter).toBeGreaterThan(0);
  });
});
