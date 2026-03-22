# API Rate Limiting

Rate limiting is enforced on all API routes via Next.js middleware to prevent abuse and ensure fair usage.

## Rate Limits

| Route pattern    | Limit          | Window |
|------------------|----------------|--------|
| `/api/auth/*`    | 100 requests   | 60 s   |
| All other `/api` | 60 requests    | 60 s   |

Limits are applied per-user (authenticated) or per-IP (unauthenticated) using a **sliding window** algorithm.

## Exempt Routes

The following routes are excluded from rate limiting:

- `/api/automation/run` — cron-triggered automation
- `/api/inbox/oauth/gmail/callback` — Gmail OAuth callback
- `/api/integrations/square/oauth/callback` — Square OAuth callback

## Caller Identification

1. **Authenticated requests** — identified by the user's ID from the JWT session token.
2. **Unauthenticated requests** — identified by the first IP in the `X-Forwarded-For` header.
3. **Fallback** — if neither is available, the identifier is `"anonymous"` (shared bucket).

## Response Headers

Every API response includes rate limit information:

| Header                  | Description                                |
|-------------------------|--------------------------------------------|
| `X-RateLimit-Remaining` | Requests remaining in the current window   |
| `X-RateLimit-Reset`     | Unix timestamp (ms) when the window resets |

## 429 Response

When the limit is exceeded the API returns:

```
HTTP/1.1 429 Too Many Requests
Retry-After: <seconds>
X-RateLimit-Remaining: 0
X-RateLimit-Reset: <unix ms>
Content-Type: application/json
```

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 45
}
```

Clients should wait the number of seconds specified in the `Retry-After` header before retrying.

## Configuration

### Environment Variables

| Variable                    | Required | Description                          |
|-----------------------------|----------|--------------------------------------|
| `UPSTASH_REDIS_REST_URL`    | No       | Upstash Redis REST endpoint URL      |
| `UPSTASH_REDIS_REST_TOKEN`  | No       | Upstash Redis REST auth token        |

### Storage Backend

- **Redis (recommended for production)** — Set both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Provides accurate rate limiting across all serverless instances.
- **In-memory (local dev fallback)** — Used automatically when Redis credentials are not set. State is ephemeral and per-instance, so limits are not reliably enforced in serverless/multi-instance deployments.

### Changing Limits

Rate limits are hardcoded in `lib/rate-limit.ts`. To adjust:

```ts
// Auth routes
export const authLimiter = new Ratelimit({
  limiter: Ratelimit.slidingWindow(100, "60 s"), // <-- change 100 or "60 s"
  ...
});

// General API routes
export const apiLimiter = new Ratelimit({
  limiter: Ratelimit.slidingWindow(60, "60 s"),  // <-- change 60 or "60 s"
  ...
});
```

### Adding Exempt Routes

Add path prefixes to the `EXEMPT_PREFIXES` array in `lib/rate-limit.ts`:

```ts
const EXEMPT_PREFIXES = [
  "/api/automation/run",
  "/api/inbox/oauth/gmail/callback",
  "/api/integrations/square/oauth/callback",
  "/api/your-new-route",  // <-- add here
];
```

## Architecture

```
Request
  → middleware.ts
      ├── /api/* routes
      │     ├── exempt? → pass through
      │     └── checkRateLimit(identifier, pathname)
      │           ├── allowed → NextResponse.next() + rate limit headers
      │           └── denied  → 429 + Retry-After + JSON body
      └── page routes → existing auth redirect logic (unchanged)
```

Key files:

- `lib/rate-limit.ts` — limiter instances, check function, response helpers
- `lib/rate-limit.test.ts` — unit and integration tests
- `middleware.ts` — enforcement point
