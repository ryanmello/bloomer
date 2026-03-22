import {beforeEach, describe, expect, it, vi} from "vitest";

// Mock external dependencies, We DO NOT want to hit real database or auth
vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}));

// Mock next cookies(), We fake the activeShopId cookie.
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock Prisma client. We only mock the methods used by this route file.
vi.mock("@/lib/prisma", () => ({
  default: {
    shop: {
      findFirst: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
  },
}));

import db from "@/lib/prisma";
import {cookies} from "next/headers";
import {getCurrentUser} from "@/actions/getCurrentUser";
import {GET, POST} from "@/app/api/orders/route";

describe("/api/orders route", () => {
  // fake user + shop used across tests
  const mockUser = {id: "user123"};
  const mockShop = {id: "shop123", userId: "user123"};

  // Reset mocks before every test. Ensures no test affects another
  beforeEach(() => {
    vi.clearAllMocks();

    // simulate logged-in user
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    // simulate cookie with activeShopId
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({value: "shop123"}),
    } as any);

    // simulate finding a shop
    vi.mocked(db.shop.findFirst).mockResolvedValue(mockShop as any);
  });

  // ============================ GET TESTS ============================

  describe("GET", () => {
    it("returns 401 if not authenticated", async () => {
      // simulate NOT logged in
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({message: "Not authenticated"});
    });

    it("returns 404 if no shop found", async () => {
      // simulate no shop
      vi.mocked(db.shop.findFirst).mockResolvedValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({error: "No shop found"});
    });

    it("returns orders successfully", async () => {
      // fake DB response
      const mockOrders = [
        {
          id: "order1",
          shopId: "shop123",
          userId: "user123",
          totalAmount: 25,
          status: "PENDING",
          customer: {
            id: "cust1",
            firstName: "Sarah",
            lastName: "Mitchell",
          },
        },
      ];

      vi.mocked(db.order.findMany).mockResolvedValue(mockOrders as any);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(mockOrders);

      // Verify correct DB query
      expect(db.order.findMany).toHaveBeenCalledWith({
        where: {
          shopId: "shop123",
          userId: "user123",
        },
        include: {
          customer: true,
        },
      });
    });

    it("returns 500 if DB throws error", async () => {
      // simulate DB crash
      vi.mocked(db.order.findMany).mockRejectedValue(new Error("DB fail"));

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({message: "Failed to fetch order Data"});
    });
  });

  // ============================ POST TESTS ============================

  describe("POST", () => {
    // helper to simulate a POST request
    const makeRequest = (body: any) =>
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

    it("returns 401 if not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const res = await POST(makeRequest({}));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({message: "Not authenticated"});
    });

    it("returns 404 if no shop found", async () => {
      vi.mocked(db.shop.findFirst).mockResolvedValue(null);

      const res = await POST(
        makeRequest({
          status: "PENDING",
          orderItems: [{productId: "p1", quantity: 1}],
        }),
      );

      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({error: "No shop found"});
    });

    it("returns 400 if orderItems is empty", async () => {
      const res = await POST(
        makeRequest({
          status: "PENDING",
          orderItems: [],
        }),
      );

      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("At least one product is required");
    });

    it("returns 400 if products are invalid", async () => {
      // DB only returns 1 product, but request has 2
      vi.mocked(db.product.findMany).mockResolvedValue([
        {
          id: "p1",
          quantity: 3,
          retailPrice: 10,
          shopId: "shop123",
          isActive: true,
        },
      ] as any);

      const res = await POST(
        makeRequest({
          orderItems: [
            {productId: "p1", quantity: 2},
            {productId: "p2", quantity: 1},
          ],
        }),
      );

      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("One or more products are invalid");
    });

    it("creates order successfully", async () => {
      // fake products
      vi.mocked(db.product.findMany).mockResolvedValue([
        {
          id: "p1",
          quantity: 3,
          retailPrice: 10,
        },
        {
          id: "p2",
          quantity: 1,
          retailPrice: 5,
        },
      ] as any);

      vi.mocked(db.order.create).mockResolvedValue({
        id: "order123",
        totalAmount: 25,
      } as any);

      const res = await POST(
        makeRequest({
          customerId: "walk-in",
          orderItems: [
            {productId: "p1", quantity: 2},
            {productId: "p2", quantity: 1},
          ],
        }),
      );

      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.message).toBe("Order created successfully!");

      // verify total calculation + DB write
      expect(db.order.create).toHaveBeenCalled();
    });

    it("computes neededQty when stock is insufficient", async () => {
      vi.mocked(db.product.findMany).mockResolvedValue([
        {
          id: "p1",
          quantity: 3, // only 3 in stock
          retailPrice: 10,
        },
      ] as any);

      vi.mocked(db.order.create).mockResolvedValue({} as any);

      await POST(
        makeRequest({
          orderItems: [{productId: "p1", quantity: 5}], // order 5
        }),
      );

      // check calculation logic
      expect(db.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderItems: {
              create: [
                expect.objectContaining({
                  quantity: 5,
                  availableQty: 3,
                  neededQty: 2, // key logic
                }),
              ],
            },
          }),
        }),
      );
    });
  });
});
