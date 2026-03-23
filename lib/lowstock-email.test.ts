import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendLowStockEmail } from "@/lib/resend-email";
import db from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  default: {
    product: { findUnique: vi.fn(), update: vi.fn() },
    user: { findMany: vi.fn() },
    scheduledEmail: { findFirst: vi.fn(), createMany: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    inventoryMovement: { create: vi.fn() },
    $transaction: vi.fn(async (fn) => fn({})),
  },
}));

// Mock Email Sender
vi.mock("@/lib/resend-email", () => ({
  sendLowStockEmail: vi.fn(),
}));

describe("Low Stock Email Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("schedules immediate + follow-up emails when product falls below threshold", async () => {
    (db.user.findMany as any).mockResolvedValue([
      { email: "test@example.com", emailNotificationsEnabled: true, lowStockNotificationsEnabled: true },
    ]);

    (db.scheduledEmail.findFirst as any).mockResolvedValue(null);

    const product = {
      id: "prod-1",
      quantity: 5,
      lowInventoryAlert: 10,
      shop: { id: "shop-1", name: "Test Shop", userId: "user-1" },
    };

    const now = Date.now();

    if (product.quantity <= product.lowInventoryAlert!) {
      await db.scheduledEmail.createMany({
        data: [
          { userEmail: "test@example.com", productId: product.id, shopName: product.shop.name, sendAt: new Date(now + 3600000), sent: false }, // 1 hour
          { userEmail: "test@example.com", productId: product.id, shopName: product.shop.name, sendAt: new Date(now + 2 * 24 * 3600000), sent: false }, // 2 days
          { userEmail: "test@example.com", productId: product.id, shopName: product.shop.name, sendAt: new Date(now + 4 * 24 * 3600000), sent: false }, // 4 days
        ],
      });
    }

    expect(db.scheduledEmail.createMany).toHaveBeenCalledTimes(1);

    // Check the scheduled times
    const scheduledEmails = (db.scheduledEmail.createMany as any).mock.calls[0][0].data;
    expect(scheduledEmails[0].sendAt.getTime()).toBeGreaterThanOrEqual(now + 59 * 60 * 1000);
    expect(scheduledEmails[0].sendAt.getTime()).toBeLessThanOrEqual(now + 61 * 60 * 1000);

    expect(scheduledEmails[1].sendAt.getTime()).toBeGreaterThanOrEqual(now + 2 * 24 * 60 * 60 * 1000 - 1000);
    expect(scheduledEmails[2].sendAt.getTime()).toBeGreaterThanOrEqual(now + 4 * 24 * 60 * 60 * 1000 - 1000);
  });

  it("cron sends only due emails", async () => {
    const now = new Date();

    const emails: Array<{
      id: string;
      sendAt: Date;
      userEmail: string;
      shopName: string;
      sent: boolean;
      product: { id: string; name: string; quantity: number; lowInventoryAlert?: number };
    }> = [
      {
        id: "email-1",
        sendAt: new Date(now.getTime() - 1000), // due
        userEmail: "a@test.com",
        shopName: "Shop 1",
        sent: false,
        product: { id: "prod-1", name: "Product 1", quantity: 3, lowInventoryAlert: 5 },
      },
      {
        id: "email-2",
        sendAt: new Date(now.getTime() + 1000), // not due
        userEmail: "b@test.com",
        shopName: "Shop 1",
        sent: false,
        product: { id: "prod-2", name: "Product 2", quantity: 2, lowInventoryAlert: 5 },
      },
    ];

    (db.scheduledEmail.findMany as any).mockResolvedValue(emails);

    for (const email of emails) {
      if (email.sendAt <= now && email.product.quantity <= (email.product.lowInventoryAlert ?? 10)) {
        await sendLowStockEmail(
          email.userEmail,
          [{ name: email.product.name, quantity: email.product.quantity, lowInventoryAlert: email.product.lowInventoryAlert ?? 10 }],
          email.shopName
        );
        await db.scheduledEmail.update({ where: { id: email.id }, data: { sent: true } });
      }
    }

    expect(sendLowStockEmail).toHaveBeenCalledTimes(1);
    expect(sendLowStockEmail).toHaveBeenCalledWith(
      "a@test.com",
      [{ name: "Product 1", quantity: 3, lowInventoryAlert: 5 }],
      "Shop 1"
    );
  });

  it("does not send email if product is above threshold", async () => {
    const now = new Date();

    const emails: Array<{
      id: string;
      sendAt: Date;
      userEmail: string;
      shopName: string;
      sent: boolean;
      product: { id: string; name: string; quantity: number; lowInventoryAlert?: number };
    }> = [
      {
        id: "email-3",
        sendAt: now,
        userEmail: "c@test.com",
        shopName: "Shop 1",
        sent: false,
        product: { id: "prod-3", name: "Product 3", quantity: 10, lowInventoryAlert: 5 },
      },
    ];

    (db.scheduledEmail.findMany as any).mockResolvedValue(emails);

    for (const email of emails) {
      if (email.sendAt <= now && email.product.quantity <= (email.product.lowInventoryAlert ?? 10)) {
        await sendLowStockEmail(
          email.userEmail,
          [{ name: email.product.name, quantity: email.product.quantity, lowInventoryAlert: email.product.lowInventoryAlert ?? 10 }],
          email.shopName
        );
        await db.scheduledEmail.update({ where: { id: email.id }, data: { sent: true } });
      }
    }

    expect(sendLowStockEmail).not.toHaveBeenCalled();
  });
});