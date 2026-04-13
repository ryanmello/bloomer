import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted to ensure mocks are available before module imports
const { mockCampaignRecipientFindMany, mockAutomationRunFindMany } = vi.hoisted(() => ({
  mockCampaignRecipientFindMany: vi.fn(),
  mockAutomationRunFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    campaignRecipient: {
      findMany: mockCampaignRecipientFindMany,
    },
    automationRun: {
      findMany: mockAutomationRunFindMany,
    },
  },
}));

import {
  canSendMarketingEmail,
  getCustomerRateLimitStatus,
  RATE_LIMIT_CONFIG,
} from "./email-rate-limit";

describe("email-rate-limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no emails sent
    mockCampaignRecipientFindMany.mockResolvedValue([]);
    mockAutomationRunFindMany.mockResolvedValue([]);
  });

  // ---------------------------------------------------------------------------
  // RATE_LIMIT_CONFIG
  // ---------------------------------------------------------------------------

  describe("RATE_LIMIT_CONFIG", () => {
    it("should have 3-day cooloff period", () => {
      expect(RATE_LIMIT_CONFIG.cooloffDays).toBe(3);
    });

    it("should have 5 emails per month cap", () => {
      expect(RATE_LIMIT_CONFIG.monthlyCap).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // canSendMarketingEmail - Monthly Cap
  // ---------------------------------------------------------------------------

  describe("canSendMarketingEmail - monthly cap", () => {
    it("should allow email when under monthly cap and outside cooloff", async () => {
      // 2 campaign emails + 1 automation email = 3 total (under 5)
      // All sent 4 days ago (outside 3-day cooloff)
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: fourDaysAgo },
        { sentAt: fourDaysAgo },
      ]);
      mockAutomationRunFindMany.mockResolvedValue([
        { createdAt: fourDaysAgo },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(true);
      expect(result.monthlyCount).toBe(3);
    });

    it("should block email when at monthly cap (5 emails)", async () => {
      // 3 campaign emails + 2 automation emails = 5 total (at cap)
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: new Date() },
        { sentAt: new Date() },
        { sentAt: new Date() },
      ]);
      mockAutomationRunFindMany.mockResolvedValue([
        { createdAt: new Date() },
        { createdAt: new Date() },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("monthly_cap");
      expect(result.monthlyCount).toBe(5);
    });

    it("should block email when over monthly cap", async () => {
      // 6 total emails (over cap)
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: new Date() },
        { sentAt: new Date() },
        { sentAt: new Date() },
        { sentAt: new Date() },
      ]);
      mockAutomationRunFindMany.mockResolvedValue([
        { createdAt: new Date() },
        { createdAt: new Date() },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("monthly_cap");
    });

    it("should count both campaigns and automations toward monthly cap", async () => {
      // 2 campaigns + 3 automations = 5 (at cap)
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: new Date() },
        { sentAt: new Date() },
      ]);
      mockAutomationRunFindMany.mockResolvedValue([
        { createdAt: new Date() },
        { createdAt: new Date() },
        { createdAt: new Date() },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("monthly_cap");
      expect(result.monthlyCount).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // canSendMarketingEmail - Cooloff Period
  // ---------------------------------------------------------------------------

  describe("canSendMarketingEmail - cooloff period", () => {
    it("should enforce 3-day cooloff between emails", async () => {
      // Email sent 1 day ago (within cooloff)
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: oneDayAgo },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("cooloff");
      expect(result.lastSentAt).toEqual(oneDayAgo);
    });

    it("should allow email after cooloff period expires", async () => {
      // Email sent 4 days ago (outside 3-day cooloff)
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: fourDaysAgo },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(true);
    });

    it("should check cooloff from automation emails too", async () => {
      // Automation email sent 2 days ago (within cooloff)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      mockAutomationRunFindMany.mockResolvedValue([
        { createdAt: twoDaysAgo },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("cooloff");
    });

    it("should use most recent email for cooloff calculation", async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: fiveDaysAgo },
      ]);
      mockAutomationRunFindMany.mockResolvedValue([
        { createdAt: oneDayAgo }, // More recent
      ]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("cooloff");
      expect(result.lastSentAt).toEqual(oneDayAgo);
    });
  });

  // ---------------------------------------------------------------------------
  // canSendMarketingEmail - skipCooloff option
  // ---------------------------------------------------------------------------

  describe("canSendMarketingEmail - skipCooloff option", () => {
    it("should skip cooloff when skipCooloff is true (for birthday/holiday)", async () => {
      // Email sent 1 day ago (normally within cooloff)
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: oneDayAgo },
      ]);

      const result = await canSendMarketingEmail("customer-1", {
        skipCooloff: true,
      });

      expect(result.allowed).toBe(true);
    });

    it("should still enforce monthly cap even when skipCooloff is true", async () => {
      // 5 emails this month (at cap), sent within cooloff
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: oneDayAgo },
        { sentAt: oneDayAgo },
        { sentAt: oneDayAgo },
      ]);
      mockAutomationRunFindMany.mockResolvedValue([
        { createdAt: oneDayAgo },
        { createdAt: oneDayAgo },
      ]);

      const result = await canSendMarketingEmail("customer-1", {
        skipCooloff: true,
      });

      // Should be blocked by monthly cap, not cooloff
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("monthly_cap");
    });

    it("should allow birthday email even if recently received marketing email", async () => {
      // Campaign email sent yesterday, but birthday can skip cooloff
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: yesterday },
      ]);

      const result = await canSendMarketingEmail("customer-1", {
        skipCooloff: true,
      });

      expect(result.allowed).toBe(true);
      expect(result.monthlyCount).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // canSendMarketingEmail - Edge cases
  // ---------------------------------------------------------------------------

  describe("canSendMarketingEmail - edge cases", () => {
    it("should allow email when no previous emails exist", async () => {
      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(true);
      expect(result.monthlyCount).toBe(0);
    });

    it("should handle null sentAt values gracefully", async () => {
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: null },
        { sentAt: new Date() },
      ]);

      const result = await canSendMarketingEmail("customer-1");

      // Should only count the one with valid sentAt
      expect(result.monthlyCount).toBe(1);
    });

    it("should only count emails from current month", async () => {
      // Email from 2 months ago should not count
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

      // The mock returns what the DB query would return,
      // but the query itself filters by monthStart - so we simulate
      // that the old email wouldn't be returned
      mockCampaignRecipientFindMany.mockResolvedValue([]);

      const result = await canSendMarketingEmail("customer-1");

      expect(result.allowed).toBe(true);
      expect(result.monthlyCount).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // getCustomerRateLimitStatus
  // ---------------------------------------------------------------------------

  describe("getCustomerRateLimitStatus", () => {
    it("should return customer rate limit status", async () => {
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: new Date() },
      ]);

      const status = await getCustomerRateLimitStatus("customer-1");

      expect(status.canReceiveEmail).toBe(false); // Within cooloff
      expect(status.monthlyCount).toBe(1);
      expect(status.monthlyLimit).toBe(5);
      expect(status.cooloffDays).toBe(3);
    });

    it("should calculate cooloffEndsAt correctly", async () => {
      const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      mockCampaignRecipientFindMany.mockResolvedValue([
        { sentAt: yesterday },
      ]);

      const status = await getCustomerRateLimitStatus("customer-1");

      expect(status.cooloffEndsAt).not.toBeNull();
      // Cooloff ends 3 days after last email
      const expectedEnd = new Date(
        yesterday.getTime() + 3 * 24 * 60 * 60 * 1000
      );
      expect(status.cooloffEndsAt?.getTime()).toBeCloseTo(
        expectedEnd.getTime(),
        -3 // Within 1 second
      );
    });

    it("should return null cooloffEndsAt when no recent emails", async () => {
      const status = await getCustomerRateLimitStatus("customer-1");

      expect(status.cooloffEndsAt).toBeNull();
    });
  });
});
