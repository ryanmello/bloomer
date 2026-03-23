import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockUser = { id: "user-1", email: "test@example.com" } as never;
const mockProduct = {
  id: "prod-1",
  shopId: "shop-1",
  shop: { userId: "user-1" },
};
const mockMovement = {
  id: "mov-1",
  type: "adjustment",
  quantity: 5,
  previousInventory: 10,
  newInventory: 15,
  reason: "Restock",
  notes: null,
  createdAt: new Date("2025-03-11T12:00:00.000Z"),
};

vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    product: {
      findUnique: vi.fn(),
    },
    inventoryMovement: {
      findMany: vi.fn(),
    },
  },
}));

import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";
import { GET } from "./route";

describe("Inventory Movement History API (UN-770)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct as never);
    vi.mocked(db.inventoryMovement.findMany).mockResolvedValue([mockMovement] as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/products/prod-1/movements");
    const res = await GET(req, {
      params: Promise.resolve({ id: "prod-1" }),
    });
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when product not found", async () => {
    vi.mocked(db.product.findUnique).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/products/bad-id/movements");
    const res = await GET(req, {
      params: Promise.resolve({ id: "bad-id" }),
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Product not found");
  });

  it("returns 403 when product belongs to another user's shop", async () => {
    vi.mocked(db.product.findUnique).mockResolvedValue({
      ...mockProduct,
      shop: { userId: "other-user" },
    } as never);
    const req = new NextRequest("http://localhost/api/products/prod-1/movements");
    const res = await GET(req, {
      params: Promise.resolve({ id: "prod-1" }),
    });
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized to view this product");
  });

  it("returns movement items with type, quantity, previous/new inventory, reason, timestamp", async () => {
    const req = new NextRequest("http://localhost/api/products/prod-1/movements");
    const res = await GET(req, {
      params: Promise.resolve({ id: "prod-1" }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toMatchObject({
      id: "mov-1",
      type: "adjustment",
      quantity: 5,
      previousInventory: 10,
      newInventory: 15,
      reason: "Restock",
      createdAt: "2025-03-11T12:00:00.000Z",
    });
    expect(json.items[0]).toHaveProperty("notes");
  });

  it("returns pagination metadata", async () => {
    vi.mocked(db.inventoryMovement.findMany).mockResolvedValue([mockMovement] as never);
    const req = new NextRequest("http://localhost/api/products/prod-1/movements?limit=5");
    const res = await GET(req, {
      params: Promise.resolve({ id: "prod-1" }),
    });
    const json = await res.json();
    expect(json).toHaveProperty("nextCursor");
    expect(json).toHaveProperty("hasMore");
    expect(Array.isArray(json.items)).toBe(true);
  });

  it("respects limit query param", async () => {
    const req = new NextRequest("http://localhost/api/products/prod-1/movements?limit=3");
    await GET(req, { params: Promise.resolve({ id: "prod-1" }) });
    expect(db.inventoryMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 4,
      })
    );
  });

  it("uses cursor for next page when provided", async () => {
    const req = new NextRequest(
      "http://localhost/api/products/prod-1/movements?cursor=eyJpZCI6Im1vdi0xIn0"
    );
    await GET(req, { params: Promise.resolve({ id: "prod-1" }) });
    expect(db.inventoryMovement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        cursor: { id: "mov-1" },
        skip: 1,
      })
    );
  });
});
