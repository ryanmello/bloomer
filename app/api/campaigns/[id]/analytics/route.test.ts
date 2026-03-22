import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockGetCurrentUser,
  mockCampaignFindUnique,
  mockRecipientFindMany,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockCampaignFindUnique: vi.fn(),
  mockRecipientFindMany: vi.fn(),
}));

vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    campaign: { findUnique: mockCampaignFindUnique },
    campaignRecipient: { findMany: mockRecipientFindMany },
  },
}));

import { GET } from "./route";
import { NextRequest } from "next/server";

function buildRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"));
}

const MOCK_USER = { id: "user-1", email: "owner@example.com" };
const OTHER_USER = { id: "user-other", email: "other@example.com" };

const MOCK_CAMPAIGN = {
  id: "campaign-1",
  campaignName: "Spring Sale",
  status: "Sent",
  sentAt: new Date("2026-03-01T12:00:00Z"),
  userId: "user-1",
  shopId: "shop-1",
};

const MOCK_PARAMS = Promise.resolve({ id: "campaign-1" });

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
describe("GET /api/campaigns/[id]/analytics - Authentication", () => {
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
    expect(mockCampaignFindUnique).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------
describe("GET /api/campaigns/[id]/analytics - Authorization", () => {
  it("returns 403 when campaign belongs to another user", async () => {
    mockGetCurrentUser.mockResolvedValue(OTHER_USER);
    mockCampaignFindUnique.mockResolvedValue(MOCK_CAMPAIGN);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.message).toBe("Unauthorized");
    expect(mockRecipientFindMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Campaign not found
// ---------------------------------------------------------------------------
describe("GET /api/campaigns/[id]/analytics - Not found", () => {
  it("returns 404 when campaign does not exist", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCampaignFindUnique.mockResolvedValue(null);

    const res = await GET(
      buildRequest("/api/campaigns/nonexistent/analytics"),
      { params: Promise.resolve({ id: "nonexistent" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toBe("Campaign not found");
  });
});

// ---------------------------------------------------------------------------
// Successful analytics
// ---------------------------------------------------------------------------
describe("GET /api/campaigns/[id]/analytics - Success", () => {
  beforeEach(() => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCampaignFindUnique.mockResolvedValue(MOCK_CAMPAIGN);
  });

  it("returns correct counts for a fully-delivered campaign", async () => {
    mockRecipientFindMany.mockResolvedValue([
      { status: "Sent", sentAt: new Date(), openedAt: null, clickedAt: null },
      { status: "Opened", sentAt: new Date(), openedAt: new Date(), clickedAt: null },
      { status: "Clicked", sentAt: new Date(), openedAt: new Date(), clickedAt: new Date() },
      { status: "Failed", sentAt: null, openedAt: null, clickedAt: null },
      { status: "Pending", sentAt: null, openedAt: null, clickedAt: null },
    ]);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.campaignId).toBe("campaign-1");
    expect(body.campaignName).toBe("Spring Sale");
    expect(body.status).toBe("Sent");
    expect(body.totalRecipients).toBe(5);
    expect(body.sentCount).toBe(3);
    expect(body.openCount).toBe(2);
    expect(body.clickCount).toBe(1);
    expect(body.deliveryStatusBreakdown).toEqual({
      Sent: 1,
      Opened: 1,
      Clicked: 1,
      Failed: 1,
      Pending: 1,
    });
  });

  it("returns zeros when campaign has no recipients", async () => {
    mockRecipientFindMany.mockResolvedValue([]);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalRecipients).toBe(0);
    expect(body.sentCount).toBe(0);
    expect(body.openCount).toBe(0);
    expect(body.clickCount).toBe(0);
    expect(body.deliveryStatusBreakdown).toEqual({});
  });

  it("returns all-sent when every recipient was delivered", async () => {
    mockRecipientFindMany.mockResolvedValue([
      { status: "Sent", sentAt: new Date(), openedAt: null, clickedAt: null },
      { status: "Sent", sentAt: new Date(), openedAt: null, clickedAt: null },
      { status: "Sent", sentAt: new Date(), openedAt: null, clickedAt: null },
    ]);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(body.totalRecipients).toBe(3);
    expect(body.sentCount).toBe(3);
    expect(body.openCount).toBe(0);
    expect(body.clickCount).toBe(0);
    expect(body.deliveryStatusBreakdown).toEqual({ Sent: 3 });
  });

  it("returns all-failed when every recipient failed", async () => {
    mockRecipientFindMany.mockResolvedValue([
      { status: "Failed", sentAt: null, openedAt: null, clickedAt: null },
      { status: "Failed", sentAt: null, openedAt: null, clickedAt: null },
    ]);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(body.totalRecipients).toBe(2);
    expect(body.sentCount).toBe(0);
    expect(body.openCount).toBe(0);
    expect(body.clickCount).toBe(0);
    expect(body.deliveryStatusBreakdown).toEqual({ Failed: 2 });
  });

  it("counts openedAt independently from status field", async () => {
    mockRecipientFindMany.mockResolvedValue([
      { status: "Opened", sentAt: new Date(), openedAt: new Date(), clickedAt: null },
      { status: "Opened", sentAt: new Date(), openedAt: new Date(), clickedAt: null },
      { status: "Clicked", sentAt: new Date(), openedAt: new Date(), clickedAt: new Date() },
    ]);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(body.sentCount).toBe(3);
    expect(body.openCount).toBe(3);
    expect(body.clickCount).toBe(1);
  });

  it("handles a draft campaign with all-pending recipients", async () => {
    mockCampaignFindUnique.mockResolvedValue({
      ...MOCK_CAMPAIGN,
      status: "Draft",
      sentAt: null,
    });
    mockRecipientFindMany.mockResolvedValue([
      { status: "Pending", sentAt: null, openedAt: null, clickedAt: null },
      { status: "Pending", sentAt: null, openedAt: null, clickedAt: null },
    ]);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(body.status).toBe("Draft");
    expect(body.sentAt).toBeNull();
    expect(body.totalRecipients).toBe(2);
    expect(body.sentCount).toBe(0);
    expect(body.deliveryStatusBreakdown).toEqual({ Pending: 2 });
  });

  it("includes campaign metadata in the response", async () => {
    mockRecipientFindMany.mockResolvedValue([]);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(body).toHaveProperty("campaignId");
    expect(body).toHaveProperty("campaignName");
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("sentAt");
    expect(body).toHaveProperty("totalRecipients");
    expect(body).toHaveProperty("sentCount");
    expect(body).toHaveProperty("openCount");
    expect(body).toHaveProperty("clickCount");
    expect(body).toHaveProperty("deliveryStatusBreakdown");
  });

  it("scopes recipient query to the campaign id", async () => {
    mockRecipientFindMany.mockResolvedValue([]);

    await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );

    expect(mockRecipientFindMany).toHaveBeenCalledWith({
      where: { campaignId: "campaign-1" },
      select: {
        status: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
      },
    });
  });

  it("handles large recipient sets with mixed statuses", async () => {
    const recipients = [
      ...Array(50).fill(null).map(() => ({
        status: "Sent", sentAt: new Date(), openedAt: null, clickedAt: null,
      })),
      ...Array(30).fill(null).map(() => ({
        status: "Opened", sentAt: new Date(), openedAt: new Date(), clickedAt: null,
      })),
      ...Array(10).fill(null).map(() => ({
        status: "Clicked", sentAt: new Date(), openedAt: new Date(), clickedAt: new Date(),
      })),
      ...Array(5).fill(null).map(() => ({
        status: "Failed", sentAt: null, openedAt: null, clickedAt: null,
      })),
      ...Array(5).fill(null).map(() => ({
        status: "Pending", sentAt: null, openedAt: null, clickedAt: null,
      })),
    ];
    mockRecipientFindMany.mockResolvedValue(recipients);

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(body.totalRecipients).toBe(100);
    expect(body.sentCount).toBe(90);
    expect(body.openCount).toBe(40);
    expect(body.clickCount).toBe(10);
    expect(body.deliveryStatusBreakdown).toEqual({
      Sent: 50,
      Opened: 30,
      Clicked: 10,
      Failed: 5,
      Pending: 5,
    });
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
describe("GET /api/campaigns/[id]/analytics - Error handling", () => {
  it("returns 500 when database query fails", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCampaignFindUnique.mockRejectedValue(new Error("DB down"));

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch campaign analytics");
  });

  it("returns 500 when recipient query fails", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCampaignFindUnique.mockResolvedValue(MOCK_CAMPAIGN);
    mockRecipientFindMany.mockRejectedValue(new Error("Timeout"));

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch campaign analytics");
  });

  it("returns 500 when auth service throws", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("Auth crash"));

    const res = await GET(
      buildRequest("/api/campaigns/campaign-1/analytics"),
      { params: MOCK_PARAMS },
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch campaign analytics");
  });
});
