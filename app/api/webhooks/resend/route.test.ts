import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to ensure mocks are available before module imports
const {
  mockVerify,
  mockAutomationRunFindFirst,
  mockAutomationRunUpdate,
  mockCampaignRecipientFindFirst,
  mockCampaignRecipientUpdate,
} = vi.hoisted(() => ({
  mockVerify: vi.fn(),
  mockAutomationRunFindFirst: vi.fn(),
  mockAutomationRunUpdate: vi.fn(),
  mockCampaignRecipientFindFirst: vi.fn(),
  mockCampaignRecipientUpdate: vi.fn(),
}));

// Mock svix Webhook
vi.mock("svix", () => ({
  Webhook: class MockWebhook {
    verify = mockVerify;
  },
}));

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    automationRun: {
      findFirst: mockAutomationRunFindFirst,
      update: mockAutomationRunUpdate,
    },
    campaignRecipient: {
      findFirst: mockCampaignRecipientFindFirst,
      update: mockCampaignRecipientUpdate,
    },
  },
}));

import { POST } from "./route";

// Helper to create a mock request
function createMockRequest(
  body: object,
  headers: Record<string, string> = {}
): Request {
  return {
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers({
      "svix-id": "test-id",
      "svix-timestamp": "12345",
      "svix-signature": "test-signature",
      ...headers,
    }),
  } as unknown as Request;
}

describe("POST /api/webhooks/resend", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, RESEND_WEBHOOK_SECRET: "test-secret" };
    mockAutomationRunFindFirst.mockResolvedValue(null);
    mockCampaignRecipientFindFirst.mockResolvedValue(null);
  });

  // ---------------------------------------------------------------------------
  // Signature Verification
  // ---------------------------------------------------------------------------

  describe("signature verification", () => {
    it("should reject invalid signature", async () => {
      mockVerify.mockImplementation(() => {
        throw new Error("Invalid signature");
      });

      const request = createMockRequest({
        type: "email.delivered",
        data: { email_id: "test-email-id" },
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error).toBe("Invalid signature");
    });

    it("should accept valid signature", async () => {
      mockVerify.mockReturnValue({
        type: "email.delivered",
        data: { email_id: "test-email-id" },
      });

      const request = createMockRequest({
        type: "email.delivered",
        data: { email_id: "test-email-id" },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should skip verification when RESEND_WEBHOOK_SECRET is not set", async () => {
      delete process.env.RESEND_WEBHOOK_SECRET;

      const request = createMockRequest({
        type: "email.delivered",
        data: { email_id: "test-email-id" },
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      // Verify function should not be called
      expect(mockVerify).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // email.opened event
  // ---------------------------------------------------------------------------

  describe("email.opened event", () => {
    beforeEach(() => {
      mockVerify.mockReturnValue({
        type: "email.opened",
        data: { email_id: "test-email-id" },
      });
    });

    it("should update openedAt on AutomationRun", async () => {
      const automationRun = {
        id: "run-1",
        resendEmailId: "test-email-id",
        openedAt: null,
      };
      mockAutomationRunFindFirst.mockResolvedValue(automationRun);

      const request = createMockRequest({
        type: "email.opened",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockAutomationRunUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: { openedAt: expect.any(Date) },
      });
    });

    it("should update openedAt on CampaignRecipient", async () => {
      const campaignRecipient = {
        id: "recipient-1",
        resendEmailId: "test-email-id",
        openedAt: null,
      };
      mockCampaignRecipientFindFirst.mockResolvedValue(campaignRecipient);

      const request = createMockRequest({
        type: "email.opened",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockCampaignRecipientUpdate).toHaveBeenCalledWith({
        where: { id: "recipient-1" },
        data: {
          status: "Opened",
          openedAt: expect.any(Date),
        },
      });
    });

    it("should NOT update openedAt if already set (first open only)", async () => {
      const existingOpenedAt = new Date("2025-01-01");
      const automationRun = {
        id: "run-1",
        resendEmailId: "test-email-id",
        openedAt: existingOpenedAt, // Already opened
      };
      mockAutomationRunFindFirst.mockResolvedValue(automationRun);

      const request = createMockRequest({
        type: "email.opened",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      // Should NOT call update
      expect(mockAutomationRunUpdate).not.toHaveBeenCalled();
    });

    it("should NOT update CampaignRecipient openedAt if already set", async () => {
      const existingOpenedAt = new Date("2025-01-01");
      const campaignRecipient = {
        id: "recipient-1",
        resendEmailId: "test-email-id",
        openedAt: existingOpenedAt, // Already opened
      };
      mockCampaignRecipientFindFirst.mockResolvedValue(campaignRecipient);

      const request = createMockRequest({
        type: "email.opened",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      // Should NOT call update
      expect(mockCampaignRecipientUpdate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // email.clicked event
  // ---------------------------------------------------------------------------

  describe("email.clicked event", () => {
    beforeEach(() => {
      mockVerify.mockReturnValue({
        type: "email.clicked",
        data: { email_id: "test-email-id" },
      });
    });

    it("should update clickedAt on AutomationRun", async () => {
      const automationRun = {
        id: "run-1",
        resendEmailId: "test-email-id",
        clickedAt: null,
        openedAt: new Date(), // Already opened
      };
      mockAutomationRunFindFirst.mockResolvedValue(automationRun);

      const request = createMockRequest({
        type: "email.clicked",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockAutomationRunUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: {
          clickedAt: expect.any(Date),
          openedAt: expect.any(Date), // Preserves existing
        },
      });
    });

    it("should set openedAt if not already set when click occurs", async () => {
      const automationRun = {
        id: "run-1",
        resendEmailId: "test-email-id",
        clickedAt: null,
        openedAt: null, // NOT opened yet
      };
      mockAutomationRunFindFirst.mockResolvedValue(automationRun);

      const request = createMockRequest({
        type: "email.clicked",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockAutomationRunUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: {
          clickedAt: expect.any(Date),
          openedAt: expect.any(Date), // Should be set to now (click implies open)
        },
      });
    });

    it("should set openedAt on CampaignRecipient if not already set when click occurs", async () => {
      const campaignRecipient = {
        id: "recipient-1",
        resendEmailId: "test-email-id",
        clickedAt: null,
        openedAt: null, // NOT opened yet
      };
      mockCampaignRecipientFindFirst.mockResolvedValue(campaignRecipient);

      const request = createMockRequest({
        type: "email.clicked",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockCampaignRecipientUpdate).toHaveBeenCalledWith({
        where: { id: "recipient-1" },
        data: {
          status: "Clicked",
          clickedAt: expect.any(Date),
          openedAt: expect.any(Date), // Should be set (click implies open)
        },
      });
    });

    it("should NOT update clickedAt if already set (first click only)", async () => {
      const existingClickedAt = new Date("2025-01-01");
      const automationRun = {
        id: "run-1",
        resendEmailId: "test-email-id",
        clickedAt: existingClickedAt, // Already clicked
        openedAt: new Date("2025-01-01"),
      };
      mockAutomationRunFindFirst.mockResolvedValue(automationRun);

      const request = createMockRequest({
        type: "email.clicked",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      // Should NOT call update
      expect(mockAutomationRunUpdate).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // email.delivered event
  // ---------------------------------------------------------------------------

  describe("email.delivered event", () => {
    beforeEach(() => {
      mockVerify.mockReturnValue({
        type: "email.delivered",
        data: { email_id: "test-email-id" },
      });
    });

    it("should update status to delivered on AutomationRun", async () => {
      const automationRun = {
        id: "run-1",
        resendEmailId: "test-email-id",
      };
      mockAutomationRunFindFirst.mockResolvedValue(automationRun);

      const request = createMockRequest({
        type: "email.delivered",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockAutomationRunUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: { status: "delivered" },
      });
    });

    it("should update status to Delivered on CampaignRecipient", async () => {
      const campaignRecipient = {
        id: "recipient-1",
        resendEmailId: "test-email-id",
      };
      mockCampaignRecipientFindFirst.mockResolvedValue(campaignRecipient);

      const request = createMockRequest({
        type: "email.delivered",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockCampaignRecipientUpdate).toHaveBeenCalledWith({
        where: { id: "recipient-1" },
        data: { status: "Delivered" },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // email.bounced event
  // ---------------------------------------------------------------------------

  describe("email.bounced event", () => {
    beforeEach(() => {
      mockVerify.mockReturnValue({
        type: "email.bounced",
        data: { email_id: "test-email-id" },
      });
    });

    it("should update status to bounced on AutomationRun", async () => {
      const automationRun = {
        id: "run-1",
        resendEmailId: "test-email-id",
      };
      mockAutomationRunFindFirst.mockResolvedValue(automationRun);

      const request = createMockRequest({
        type: "email.bounced",
        data: { email_id: "test-email-id" },
      });

      await POST(request);

      expect(mockAutomationRunUpdate).toHaveBeenCalledWith({
        where: { id: "run-1" },
        data: {
          status: "bounced",
          errorMessage: "Email bounced",
        },
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Unknown email ID
  // ---------------------------------------------------------------------------

  describe("unknown email ID", () => {
    it("should handle gracefully when email ID not found", async () => {
      mockVerify.mockReturnValue({
        type: "email.opened",
        data: { email_id: "unknown-email-id" },
      });

      // Both return null (email not found in either table)
      mockAutomationRunFindFirst.mockResolvedValue(null);
      mockCampaignRecipientFindFirst.mockResolvedValue(null);

      const request = createMockRequest({
        type: "email.opened",
        data: { email_id: "unknown-email-id" },
      });

      const response = await POST(request);

      // Should still return success
      expect(response.status).toBe(200);
      // Should not update anything
      expect(mockAutomationRunUpdate).not.toHaveBeenCalled();
      expect(mockCampaignRecipientUpdate).not.toHaveBeenCalled();
    });
  });
});
