import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockGetCurrentUser,
  mockShopFindFirst,
  mockCampaignFindMany,
  mockCampaignCreate,
  mockCampaignUpdate,
  mockAudienceFindFirst,
  mockAudienceUpdate,
  mockCustomerFindMany,
  mockSendCampaignEmails,
  mockGetAllCustomers,
  mockGetNewCustomers,
  mockGetVipCustomers,
  mockGetHighSpenders,
  mockGetBirthdayNextMonth,
  mockGetInactiveCustomers,
} = vi.hoisted(() => ({
  mockGetCurrentUser: vi.fn(),
  mockShopFindFirst: vi.fn(),
  mockCampaignFindMany: vi.fn(),
  mockCampaignCreate: vi.fn(),
  mockCampaignUpdate: vi.fn(),
  mockAudienceFindFirst: vi.fn(),
  mockAudienceUpdate: vi.fn(),
  mockCustomerFindMany: vi.fn(),
  mockSendCampaignEmails: vi.fn(),
  mockGetAllCustomers: vi.fn(),
  mockGetNewCustomers: vi.fn(),
  mockGetVipCustomers: vi.fn(),
  mockGetHighSpenders: vi.fn(),
  mockGetBirthdayNextMonth: vi.fn(),
  mockGetInactiveCustomers: vi.fn(),
}));

vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    shop: { findFirst: (...args: unknown[]) => mockShopFindFirst(...args) },
    campaign: {
      findMany: (...args: unknown[]) => mockCampaignFindMany(...args),
      create: (...args: unknown[]) => mockCampaignCreate(...args),
      update: (...args: unknown[]) => mockCampaignUpdate(...args),
    },
    audience: {
      findFirst: (...args: unknown[]) => mockAudienceFindFirst(...args),
      update: (...args: unknown[]) => mockAudienceUpdate(...args),
    },
    customer: {
      findMany: (...args: unknown[]) => mockCustomerFindMany(...args),
    },
  },
}));

vi.mock("@/lib/resend-email", () => ({
  sendCampaignEmails: (...args: unknown[]) => mockSendCampaignEmails(...args),
}));

vi.mock("@/lib/audiences/predefined", () => ({
  getAllCustomers: (...args: unknown[]) => mockGetAllCustomers(...args),
  getNewCustomers: (...args: unknown[]) => mockGetNewCustomers(...args),
  getVipCustomers: (...args: unknown[]) => mockGetVipCustomers(...args),
  getHighSpenders: (...args: unknown[]) => mockGetHighSpenders(...args),
  getBirthdayNextMonth: (...args: unknown[]) => mockGetBirthdayNextMonth(...args),
  getInactiveCustomers: (...args: unknown[]) => mockGetInactiveCustomers(...args),
}));

import { GET, POST } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MOCK_USER = { id: "user-1", email: "owner@example.com" };
const MOCK_SHOP = {
  id: "shop-1",
  userId: "user-1",
  name: "Bloom Shop",
  email: "shop@bloom.com",
  address: "123 Flower St",
};

const SUBSCRIBED_CUSTOMERS = [
  { id: "c1", email: "a@b.com", firstName: "A", lastName: "B", unsubscribedAt: null },
  { id: "c2", email: "c@d.com", firstName: "C", lastName: "D", unsubscribedAt: null },
];

const BASE_CAMPAIGN_BODY = {
  campaignName: "Spring Sale",
  subject: "Big sale!",
  emailBody: "<p>50% off</p>",
};

function buildRequest(
  body: Record<string, unknown>,
  url = "http://localhost:3000/api/campaigns"
): NextRequest {
  return new NextRequest(new URL(url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function buildGetRequest(): NextRequest {
  return new NextRequest(new URL("http://localhost:3000/api/campaigns"));
}

function setupAuthAndShop() {
  mockGetCurrentUser.mockResolvedValue(MOCK_USER);
  mockShopFindFirst.mockResolvedValue(MOCK_SHOP);
}

/** Sets up env vars required by the POST route before body parsing. */
function setupEnvVars() {
  process.env.RESEND_API_KEY = "re_test_123";
  process.env.UNSUBSCRIBE_SECRET = "unsub_secret_test";
}

const CREATED_CAMPAIGN = {
  id: "camp-1",
  campaignName: "Spring Sale",
  subject: "Big sale!",
  recipients: [
    { customerId: "c1", status: "Pending" },
    { customerId: "c2", status: "Pending" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCampaignCreate.mockResolvedValue(CREATED_CAMPAIGN);
  mockCampaignUpdate.mockResolvedValue(undefined);
  mockAudienceUpdate.mockResolvedValue(undefined);
  mockSendCampaignEmails.mockResolvedValue(undefined);
  // Clear env vars -- tests that need them will call setupEnvVars()
  delete process.env.RESEND_API_KEY;
  delete process.env.UNSUBSCRIBE_SECRET;
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.UNSUBSCRIBE_SECRET;
});

// ===========================================================================
// GET /api/campaigns
// ===========================================================================
describe("GET /api/campaigns", () => {
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET(buildGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });

  it("returns 404 when user has no shop", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockShopFindFirst.mockResolvedValue(null);

    const res = await GET(buildGetRequest());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.message).toBe("No shop found");
  });

  it("resolves shop by most recent (orderBy createdAt desc)", async () => {
    setupAuthAndShop();
    mockCampaignFindMany.mockResolvedValue([]);

    await GET(buildGetRequest());

    expect(mockShopFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns campaigns with audience and recipients, ordered by createdAt desc", async () => {
    setupAuthAndShop();
    const campaigns = [{ id: "camp-1", campaignName: "Test" }];
    mockCampaignFindMany.mockResolvedValue(campaigns);

    const res = await GET(buildGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(campaigns);
    expect(mockCampaignFindMany).toHaveBeenCalledWith({
      where: { shopId: "shop-1" },
      include: {
        audience: true,
        recipients: {
          select: { id: true, status: true, customerId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns 500 on unexpected error", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("DB down"));

    const res = await GET(buildGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to fetch campaigns");
  });
});

// ===========================================================================
// POST /api/campaigns
// ===========================================================================
describe("POST /api/campaigns", () => {
  // ---- Authentication & shop ----
  describe("authentication and shop", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.message).toBe("Not authenticated");
    });

    it("returns 500 when RESEND_API_KEY is missing", async () => {
      mockGetCurrentUser.mockResolvedValue(MOCK_USER);
      // RESEND_API_KEY not set

      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("RESEND_API_KEY");
    });

    it("returns 500 when UNSUBSCRIBE_SECRET is missing", async () => {
      mockGetCurrentUser.mockResolvedValue(MOCK_USER);
      process.env.RESEND_API_KEY = "re_test_123";

      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("UNSUBSCRIBE_SECRET");
    });

    it("returns 404 when user has no shop", async () => {
      setupAuthAndShop();
      setupEnvVars();
      mockShopFindFirst.mockResolvedValue(null);

      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.message).toBe("No shop found");
    });
  });

  // ---- Validation ----
  describe("validation", () => {
    beforeEach(() => {
      setupAuthAndShop();
      setupEnvVars();
    });

    it("returns 400 when campaignName is missing", async () => {
      const res = await POST(
        buildRequest({ subject: "Hi", emailBody: "<p>Hi</p>" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Missing required fields");
    });

    it("returns 400 when subject is missing", async () => {
      const res = await POST(
        buildRequest({ campaignName: "Test", emailBody: "<p>Hi</p>" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Missing required fields");
    });

    it("returns 400 when emailBody is missing", async () => {
      const res = await POST(
        buildRequest({ campaignName: "Test", subject: "Hi" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Missing required fields");
    });

    it("returns 400 when audienceId references non-existent audience", async () => {
      mockAudienceFindFirst.mockResolvedValue(null);

      const res = await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, audienceId: "bad-audience" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Audience not found");
    });

    it("returns 400 when all customers are unsubscribed", async () => {
      mockCustomerFindMany.mockResolvedValue([
        { id: "c1", email: "a@b.com", firstName: "A", lastName: "B", unsubscribedAt: new Date() },
      ]);

      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("No customers found for selected audience");
    });

    it("returns 400 when no customers exist at all", async () => {
      mockCustomerFindMany.mockResolvedValue([]);

      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("No customers found for selected audience");
    });
  });

  // ---- Audience resolution ----
  describe("audience resolution", () => {
    beforeEach(() => {
      setupAuthAndShop();
      setupEnvVars();
      mockCustomerFindMany.mockResolvedValue(SUBSCRIBED_CUSTOMERS);
    });

    it("fetches specific customer when customerId is provided", async () => {
      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, customerId: "c1" })
      );

      expect(mockCustomerFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId: "shop-1", id: "c1" },
        })
      );
    });

    it("handles array customerId with { in: [...] }", async () => {
      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, customerId: ["c1", "c2"] })
      );

      expect(mockCustomerFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId: "shop-1", id: { in: ["c1", "c2"] } },
        })
      );
    });

    it("fetches custom audience members when audienceId with type=custom is provided", async () => {
      mockAudienceFindFirst.mockResolvedValue({
        id: "aud-1",
        type: "custom",
        predefinedType: null,
        customerIds: ["c1", "c2"],
      });

      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, audienceId: "aud-1" })
      );

      expect(mockCustomerFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId: "shop-1", id: { in: ["c1", "c2"] } },
        })
      );
    });

    it("uses predefined audience helper when type=predefined", async () => {
      mockAudienceFindFirst.mockResolvedValue({
        id: "aud-2",
        type: "predefined",
        predefinedType: "vip",
        customerIds: [],
      });
      mockGetVipCustomers.mockResolvedValue(SUBSCRIBED_CUSTOMERS);

      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, audienceId: "aud-2" })
      );

      expect(mockGetVipCustomers).toHaveBeenCalledWith("shop-1");
      // Should NOT call db.customer.findMany for predefined audiences
      expect(mockCustomerFindMany).not.toHaveBeenCalled();
    });

    it("normalizes array audienceId to first element", async () => {
      mockAudienceFindFirst.mockResolvedValue({
        id: "aud-1",
        type: "custom",
        predefinedType: null,
        customerIds: ["c1"],
      });

      await POST(
        buildRequest({
          ...BASE_CAMPAIGN_BODY,
          audienceId: ["aud-1", "aud-2"],
        })
      );

      expect(mockAudienceFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "aud-1", shopId: "shop-1" },
        })
      );
    });

    it("fetches all shop customers when neither customerId nor audienceId is provided", async () => {
      await POST(buildRequest(BASE_CAMPAIGN_BODY));

      expect(mockCustomerFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { shopId: "shop-1" },
        })
      );
    });

    it("filters out unsubscribed customers", async () => {
      mockCustomerFindMany.mockResolvedValue([
        { id: "c1", email: "a@b.com", firstName: "A", lastName: "B", unsubscribedAt: null },
        { id: "c2", email: "c@d.com", firstName: "C", lastName: "D", unsubscribedAt: new Date() },
      ]);

      await POST(buildRequest(BASE_CAMPAIGN_BODY));

      // Only c1 should be in the recipients
      const createCall = mockCampaignCreate.mock.calls[0][0];
      const recipientIds = createCall.data.recipients.create.map(
        (r: { customerId: string }) => r.customerId
      );
      expect(recipientIds).toEqual(["c1"]);
    });
  });

  // ---- Draft campaign ----
  describe("draft campaign (default)", () => {
    beforeEach(() => {
      setupAuthAndShop();
      setupEnvVars();
      mockCustomerFindMany.mockResolvedValue(SUBSCRIBED_CUSTOMERS);
    });

    it("creates campaign with Draft status by default", async () => {
      await POST(buildRequest(BASE_CAMPAIGN_BODY));

      expect(mockCampaignCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "Draft",
            scheduledFor: null,
            sentAt: null,
          }),
        })
      );
    });

    it("returns 201 with campaign data", async () => {
      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.message).toBe("Campaign created successfully");
      expect(body.campaign).toEqual(CREATED_CAMPAIGN);
    });

    it("creates recipients for each subscribed customer", async () => {
      await POST(buildRequest(BASE_CAMPAIGN_BODY));

      const createCall = mockCampaignCreate.mock.calls[0][0];
      expect(createCall.data.recipients.create).toEqual([
        { customerId: "c1", status: "Pending" },
        { customerId: "c2", status: "Pending" },
      ]);
    });

    it("does not call sendCampaignEmails for draft", async () => {
      await POST(buildRequest(BASE_CAMPAIGN_BODY));

      expect(mockSendCampaignEmails).not.toHaveBeenCalled();
    });

    it("does not update audience stats for draft", async () => {
      mockAudienceFindFirst.mockResolvedValue({
        id: "aud-1",
        type: "custom",
        predefinedType: null,
        customerIds: ["c1", "c2"],
      });

      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, audienceId: "aud-1" })
      );

      expect(mockAudienceUpdate).not.toHaveBeenCalled();
    });
  });

  // ---- Scheduled campaign ----
  describe("scheduled campaign", () => {
    beforeEach(() => {
      setupAuthAndShop();
      setupEnvVars();
      mockCustomerFindMany.mockResolvedValue(SUBSCRIBED_CUSTOMERS);
    });

    it("overrides status to Scheduled when scheduledFor is provided", async () => {
      const scheduledFor = new Date(Date.now() + 3600_000).toISOString();

      await POST(
        buildRequest({
          ...BASE_CAMPAIGN_BODY,
          status: "Draft",
          scheduledFor,
        })
      );

      const createCall = mockCampaignCreate.mock.calls[0][0];
      expect(createCall.data.status).toBe("Scheduled");
      expect(createCall.data.scheduledFor).toEqual(new Date(scheduledFor));
    });

    it("does not call sendCampaignEmails for scheduled", async () => {
      await POST(
        buildRequest({
          ...BASE_CAMPAIGN_BODY,
          scheduledFor: new Date(Date.now() + 3600_000).toISOString(),
        })
      );

      expect(mockSendCampaignEmails).not.toHaveBeenCalled();
    });
  });

  // ---- Sent campaign ----
  describe("sent campaign", () => {
    beforeEach(() => {
      setupAuthAndShop();
      setupEnvVars();
      mockCustomerFindMany.mockResolvedValue(SUBSCRIBED_CUSTOMERS);
    });

    it("updates audience stats when status is Sent and audienceId is provided", async () => {
      mockAudienceFindFirst.mockResolvedValue({
        id: "aud-1",
        type: "custom",
        predefinedType: null,
        customerIds: ["c1", "c2"],
      });

      await POST(
        buildRequest({
          ...BASE_CAMPAIGN_BODY,
          status: "Sent",
          audienceId: "aud-1",
        })
      );

      expect(mockAudienceUpdate).toHaveBeenCalledWith({
        where: { id: "aud-1" },
        data: expect.objectContaining({
          campaignsSent: { increment: 1 },
          lastCampaignName: "Spring Sale",
        }),
      });
    });

    it("does not update audience stats when status is Sent but no audienceId", async () => {
      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, status: "Sent" })
      );

      expect(mockAudienceUpdate).not.toHaveBeenCalled();
    });

    it("calls sendCampaignEmails with correct args", async () => {
      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, status: "Sent" })
      );

      expect(mockSendCampaignEmails).toHaveBeenCalledWith(
        "camp-1",                  // campaign.id
        SUBSCRIBED_CUSTOMERS,      // targetCustomers
        "Big sale!",               // subject
        "<p>50% off</p>",          // emailBody
        "Bloom Shop",              // shop.name
        "shop@bloom.com",          // shop.email
        "123 Flower St"            // shop.address
      );
    });

    it("uses 'Your Store' fallback when shop.name is empty", async () => {
      mockShopFindFirst.mockResolvedValue({ ...MOCK_SHOP, name: "" });

      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, status: "Sent" })
      );

      const [, , , , shopName] = mockSendCampaignEmails.mock.calls[0];
      expect(shopName).toBe("Your Store");
    });

    it("uses empty string fallback when shop.address is null", async () => {
      mockShopFindFirst.mockResolvedValue({ ...MOCK_SHOP, address: null });

      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, status: "Sent" })
      );

      const [, , , , , , shopAddress] = mockSendCampaignEmails.mock.calls[0];
      expect(shopAddress).toBe("");
    });

    it("still returns 201 even when sending (fire-and-forget)", async () => {
      const res = await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, status: "Sent" })
      );

      expect(res.status).toBe(201);
    });
  });

  // ---- sentAt field ----
  describe("sentAt field", () => {
    beforeEach(() => {
      setupAuthAndShop();
      setupEnvVars();
      mockCustomerFindMany.mockResolvedValue(SUBSCRIBED_CUSTOMERS);
    });

    it("parses sentAt into a Date when provided", async () => {
      const sentAt = "2026-03-15T10:00:00.000Z";

      await POST(
        buildRequest({ ...BASE_CAMPAIGN_BODY, sentAt })
      );

      const createCall = mockCampaignCreate.mock.calls[0][0];
      expect(createCall.data.sentAt).toEqual(new Date(sentAt));
    });

    it("sets sentAt to null when not provided", async () => {
      await POST(buildRequest(BASE_CAMPAIGN_BODY));

      const createCall = mockCampaignCreate.mock.calls[0][0];
      expect(createCall.data.sentAt).toBeNull();
    });
  });

  // ---- Error handling ----
  describe("error handling", () => {
    it("returns 500 on unexpected error", async () => {
      mockGetCurrentUser.mockRejectedValue(new Error("DB down"));

      const res = await POST(buildRequest(BASE_CAMPAIGN_BODY));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Failed to create campaign");
    });
  });
});
