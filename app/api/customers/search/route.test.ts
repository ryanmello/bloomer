import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFindFirst, mockFindMany, mockGetCurrentUser, mockCookieGet } =
  vi.hoisted(() => ({
    mockFindFirst: vi.fn(),
    mockFindMany: vi.fn(),
    mockGetCurrentUser: vi.fn(),
    mockCookieGet: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  default: {
    shop: { findFirst: mockFindFirst },
    customer: { findMany: mockFindMany },
  },
}));

vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}));

import { GET } from "./route";
import { NextRequest } from "next/server";

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

const MOCK_USER = { id: "user-1", email: "owner@example.com" };
const MOCK_SHOP = { id: "shop-1", userId: "user-1", name: "Test Shop" };

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
describe("GET /api/customers/search - Authentication", () => {
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET(buildRequest("/api/customers/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });
});

// ---------------------------------------------------------------------------
// Shop scoping & authorization
// ---------------------------------------------------------------------------
describe("GET /api/customers/search - Shop scoping", () => {
  it("returns 404 when user has no shops", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValue(null);

    const res = await GET(buildRequest("/api/customers/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("No shop found");
  });

  it("uses activeShopId from cookie when present", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue({ value: "shop-1" });
    mockFindFirst.mockResolvedValueOnce(MOCK_SHOP);
    mockFindMany.mockResolvedValue([]);

    await GET(buildRequest("/api/customers/search?q=alice"));

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "shop-1", userId: "user-1" },
    });
  });

  it("falls back to first shop when activeShopId cookie is missing", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValueOnce(MOCK_SHOP);
    mockFindMany.mockResolvedValue([]);

    await GET(buildRequest("/api/customers/search?q=alice"));

    expect(mockFindFirst).toHaveBeenCalledTimes(1);
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("falls back to first shop when activeShopId cookie references non-existent shop", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue({ value: "deleted-shop" });
    mockFindFirst.mockResolvedValueOnce(null); // cookie lookup fails
    mockFindFirst.mockResolvedValueOnce(MOCK_SHOP); // fallback succeeds
    mockFindMany.mockResolvedValue([]);

    await GET(buildRequest("/api/customers/search?q=test"));

    expect(mockFindFirst).toHaveBeenCalledTimes(2);
  });

  it("scopes customer search to the resolved shop", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValueOnce(MOCK_SHOP);
    mockFindMany.mockResolvedValue([]);

    await GET(buildRequest("/api/customers/search?q=alice"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ shopId: "shop-1" }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
describe("GET /api/customers/search - Validation", () => {
  it("returns 400 when q parameter is missing", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValue(MOCK_SHOP);

    const res = await GET(buildRequest("/api/customers/search"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Search query parameter 'q' is required");
  });

  it("returns 400 when q parameter is empty string", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValue(MOCK_SHOP);

    const res = await GET(buildRequest("/api/customers/search?q="));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Search query parameter 'q' is required");
  });

  it("returns 400 when q parameter is only whitespace", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValue(MOCK_SHOP);

    const res = await GET(buildRequest("/api/customers/search?q=%20%20"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Search query parameter 'q' is required");
  });
});

// ---------------------------------------------------------------------------
// Search behavior
// ---------------------------------------------------------------------------
describe("GET /api/customers/search - Search behavior", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValue(MOCK_SHOP);
  });

  it("searches across firstName, lastName, email, and phoneNumber", async () => {
    mockFindMany.mockResolvedValue([]);

    await GET(buildRequest("/api/customers/search?q=alice"));

    const call = mockFindMany.mock.calls[0][0];
    expect(call.where.OR).toEqual([
      { firstName: { contains: "alice", mode: "insensitive" } },
      { lastName: { contains: "alice", mode: "insensitive" } },
      { email: { contains: "alice", mode: "insensitive" } },
      { phoneNumber: { contains: "alice", mode: "insensitive" } },
    ]);
  });

  it("returns compact results with id, name, and email", async () => {
    mockFindMany.mockResolvedValue([
      { id: "c1", firstName: "Alice", lastName: "Smith", email: "alice@example.com" },
      { id: "c2", firstName: "Bob", lastName: "Alice", email: "bob@example.com" },
    ]);

    const res = await GET(buildRequest("/api/customers/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toEqual([
      { id: "c1", name: "Alice Smith", email: "alice@example.com" },
      { id: "c2", name: "Bob Alice", email: "bob@example.com" },
    ]);
  });

  it("returns empty results array when no customers match", async () => {
    mockFindMany.mockResolvedValue([]);

    const res = await GET(buildRequest("/api/customers/search?q=nonexistent"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results).toEqual([]);
  });

  it("only selects id, firstName, lastName, email from the database", async () => {
    mockFindMany.mockResolvedValue([]);

    await GET(buildRequest("/api/customers/search?q=test"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
    );
  });

  it("trims the search query before matching", async () => {
    mockFindMany.mockResolvedValue([]);

    await GET(buildRequest("/api/customers/search?q=%20alice%20"));

    const call = mockFindMany.mock.calls[0][0];
    expect(call.where.OR[0].firstName.contains).toBe("alice");
  });
});

// ---------------------------------------------------------------------------
// Limit / pagination
// ---------------------------------------------------------------------------
describe("GET /api/customers/search - Limit parameter", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValue(MOCK_SHOP);
    mockFindMany.mockResolvedValue([]);
  });

  it("defaults to 20 results when limit is not provided", async () => {
    await GET(buildRequest("/api/customers/search?q=a"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it("respects a valid limit parameter", async () => {
    await GET(buildRequest("/api/customers/search?q=a&limit=5"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5 }),
    );
  });

  it("caps limit at 50", async () => {
    await GET(buildRequest("/api/customers/search?q=a&limit=100"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it("ignores non-numeric limit and uses default", async () => {
    await GET(buildRequest("/api/customers/search?q=a&limit=abc"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });

  it("ignores zero or negative limit and uses default", async () => {
    await GET(buildRequest("/api/customers/search?q=a&limit=0"));

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe("GET /api/customers/search - Error handling", () => {
  it("returns 500 when an unexpected error occurs", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockFindFirst.mockResolvedValue(MOCK_SHOP);
    mockFindMany.mockRejectedValue(new Error("Database connection lost"));

    const res = await GET(buildRequest("/api/customers/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to search customers");
  });

  it("returns 500 when getCurrentUser throws", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Auth service down"));

    const res = await GET(buildRequest("/api/customers/search?q=alice"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to search customers");
  });
});
