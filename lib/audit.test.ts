import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Prisma mock ──────────────────────────────────────────────────────────────
const mockCreate = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  default: {
    auditLog: {
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

// Import after mocks are set up
import { createAuditLog } from "./audit";

// ─────────────────────────────────────────────────────────────────────────────
describe("Audit Logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createAuditLog helper ────────────────────────────────────────────────
  describe("createAuditLog", () => {
    it("should create an audit log entry with all fields", async () => {
      mockCreate.mockResolvedValue({ id: "log1" });

      await createAuditLog({
        action: "USER_LOGIN",
        userId: "user1",
        targetId: "target1",
        targetType: "Customer",
        metadata: { email: "test@example.com" },
      });

      expect(mockCreate).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          action: "USER_LOGIN",
          userId: "user1",
          targetId: "target1",
          targetType: "Customer",
          metadata: { email: "test@example.com" },
        },
      });
    });

    it("should default optional fields to null", async () => {
      mockCreate.mockResolvedValue({ id: "log2" });

      await createAuditLog({
        action: "USER_LOGIN",
        userId: "user1",
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          action: "USER_LOGIN",
          userId: "user1",
          targetId: null,
          targetType: null,
          metadata: null,
        },
      });
    });

    it("should not throw when prisma create fails", async () => {
      mockCreate.mockRejectedValue(new Error("DB down"));
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        createAuditLog({ action: "USER_LOGIN", userId: "user1" })
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith(
        "[AuditLog] Failed to create entry:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  // ── Action type coverage ─────────────────────────────────────────────────
  describe("action types", () => {
    const actions = [
      "USER_LOGIN",
      "CUSTOMER_CREATE",
      "CUSTOMER_UPDATE",
      "CUSTOMER_DELETE",
      "ORDER_STATUS_CHANGE",
      "SHOP_DISCONNECT",
    ] as const;

    it.each(actions)("should accept %s as a valid action", async (action) => {
      mockCreate.mockResolvedValue({ id: "log" });

      await createAuditLog({ action, userId: "user1" });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action }),
        })
      );
    });
  });

  // ── Metadata handling ────────────────────────────────────────────────────
  describe("metadata", () => {
    it("should store complex metadata objects", async () => {
      mockCreate.mockResolvedValue({ id: "log" });

      const metadata = {
        previousStatus: "PENDING",
        newStatus: "COMPLETED",
        orderId: "order123",
      };

      await createAuditLog({
        action: "ORDER_STATUS_CHANGE",
        userId: "user1",
        targetId: "order123",
        targetType: "Order",
        metadata,
      });

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ metadata }),
      });
    });
  });
});
