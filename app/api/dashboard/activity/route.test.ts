import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUser = { id: "user-1", email: "test@example.com" };
const mockShop = { id: "shop-1" };

vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    shop: {
      findFirst: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    inventoryMovement: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/square", () => ({
  fetchSquareOrders: vi.fn(),
}));

import { getCurrentUser } from "@/actions/getCurrentUser";
import { cookies } from "next/headers";
import db from "@/lib/prisma";
import { fetchSquareOrders } from "@/lib/square";
import { GET } from "./route";

describe("Recent Activity Feed API (UN-747, UN-748, UN-752)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "shop-1" }),
    } as never);
    vi.mocked(db.shop.findFirst).mockResolvedValue(mockShop);
    vi.mocked(db.order.findMany).mockResolvedValue([]);
    vi.mocked(db.customer.findMany).mockResolvedValue([]);
    vi.mocked(db.product.findMany).mockResolvedValue([]);
    vi.mocked(db.inventoryMovement.findMany).mockResolvedValue([]);
    vi.mocked(fetchSquareOrders).mockResolvedValue(null);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new Request("http://localhost/api/dashboard/activity");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns empty feed when user has no shop", async () => {
    vi.mocked(db.shop.findFirst).mockResolvedValue(null);
    const req = new Request("http://localhost/api/dashboard/activity");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toEqual([]);
    expect(json.nextCursor).toBeNull();
    expect(json.hasMore).toBe(false);
  });

  it("returns activity items with pagination", async () => {
    const now = new Date();
    vi.mocked(db.order.findMany).mockResolvedValue([
      {
        id: "ord-1",
        createdAt: now,
        totalAmount: 29.99,
        status: "COMPLETED",
        customer: { firstName: "Jane", lastName: "Doe" },
      },
    ] as never);
    vi.mocked(db.customer.findMany).mockResolvedValue([]);
    vi.mocked(db.product.findMany).mockResolvedValue([]);
    vi.mocked(db.inventoryMovement.findMany).mockResolvedValue([]);

    const req = new Request("http://localhost/api/dashboard/activity?limit=10");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0].type).toBe("order");
    expect(json.items[0].source).toBe("prisma");
    expect(json.items[0].data.status).toBe("COMPLETED");
  });

  it("respects limit query param", async () => {
    const req = new Request(
      "http://localhost/api/dashboard/activity?limit=5"
    );
    await GET(req);
    expect(db.order.findMany).toHaveBeenCalled();
    const json = await (await GET(req)).json();
    expect(json.items.length).toBeLessThanOrEqual(5);
  });

  it("includes low stock items when products are below threshold", async () => {
    const updatedAt = new Date();
    vi.mocked(db.order.findMany).mockResolvedValue([]);
    vi.mocked(db.customer.findMany).mockResolvedValue([]);
    vi.mocked(db.product.findMany).mockResolvedValue([
      {
        id: "prod-1",
        name: "Roses",
        quantity: 3,
        lowInventoryAlert: 10,
        updatedAt,
      },
    ] as never);
    vi.mocked(db.inventoryMovement.findMany).mockResolvedValue([]);

    const req = new Request("http://localhost/api/dashboard/activity");
    const res = await GET(req);
    const json = await res.json();
    const lowStock = json.items.filter((i: { type: string }) => i.type === "low_stock");
    expect(lowStock.length).toBeGreaterThanOrEqual(1);
    expect(lowStock[0].data.productName).toBe("Roses");
    expect(lowStock[0].data.quantity).toBe(3);
    expect(lowStock[0].data.threshold).toBe(10);
  });

  it("includes inventory adjustments", async () => {
    const createdAt = new Date();
    vi.mocked(db.order.findMany).mockResolvedValue([]);
    vi.mocked(db.customer.findMany).mockResolvedValue([]);
    vi.mocked(db.product.findMany).mockResolvedValue([]);
    vi.mocked(db.inventoryMovement.findMany).mockResolvedValue([
      {
        id: "mov-1",
        createdAt,
        quantity: -2,
        type: "sale",
        reason: "Order #123",
        product: { name: "Tulips" },
      },
    ] as never);

    const req = new Request("http://localhost/api/dashboard/activity");
    const res = await GET(req);
    const json = await res.json();
    const adj = json.items.filter(
      (i: { type: string }) => i.type === "inventory_adjustment"
    );
    expect(adj.length).toBeGreaterThanOrEqual(1);
    expect(adj[0].data.productName).toBe("Tulips");
    expect(adj[0].data.type).toBe("sale");
  });

  it("filters by shopId from query when provided", async () => {
    const req = new Request(
      "http://localhost/api/dashboard/activity?shopId=shop-99"
    );
    vi.mocked(db.shop.findFirst).mockResolvedValueOnce({
      id: "shop-99",
    } as never);
    await GET(req);
    expect(db.shop.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "shop-99" }),
      })
    );
  });
});
