import {beforeEach, describe, expect, it, vi} from "vitest";

// Mock auth helper, We do not want real auth/session in unit tests.
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
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import db from "@/lib/prisma";
import {cookies} from "next/headers";
import {getCurrentUser} from "@/actions/getCurrentUser";
import {GET, PATCH, DELETE} from "@/app/api/orders/[orderId]/route";

describe("/api/orders/[orderId] route", () => {
  // fake user + shop shared by most tests
  const mockUser = {id: "user123"};
  const mockShop = {id: "shop123", userId: "user123"};

  /**
   * reset mocks before every test
   */
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({value: "shop123"}),
    } as any);

    vi.mocked(db.shop.findFirst).mockResolvedValue(mockShop as any);
  });

  // for dynamic route params
  const params = Promise.resolve({orderId: "order123"});

  // ============================ GET /api/orders/[orderId] ============================

  describe("GET", () => {
    it("returns 401 if not authenticated", async () => {
      // simulate no logged-in user
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const res = await GET({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({message: "Not authenticated"});
    });

    it("returns 404 if no shop found", async () => {
      // simulate missing shop
      vi.mocked(db.shop.findFirst).mockResolvedValue(null);

      const res = await GET({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({error: "No shop found"});
    });

    it("returns 404 if order not found", async () => {
      // simulate no order found in DB
      vi.mocked(db.order.findFirst).mockResolvedValue(null);

      const res = await GET({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({message: "Order not found"});
    });

    it("returns one order with computed currentStock and neededQty", async () => {
      // mock order returned by Prisma
      const mockOrder = {
        id: "order123",
        status: "PENDING",
        totalAmount: 50,
        customer: {
          id: "cust1",
          firstName: "Sarah",
          lastName: "Mitchell",
        },
        orderItems: [
          {
            id: "item1",
            quantity: 5,
            unitPrice: 10,
            subPrice: 50,
            product: {
              id: "prod1",
              name: "Rose",
              quantity: 3, // current stock
            },
          },
        ],
      };

      vi.mocked(db.order.findFirst).mockResolvedValue(mockOrder as any);

      const res = await GET({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(200);

      /**
       * currentStock = product.quantity = 3
       * neededQty = ordered 5 - stock 3 = 2
       */
      expect(body).toEqual({
        ...mockOrder,
        orderItems: [
          {
            ...mockOrder.orderItems[0],
            currentStock: 3,
            neededQty: 2,
          },
        ],
      });

      // verify correct DB query
      expect(db.order.findFirst).toHaveBeenCalledWith({
        where: {
          id: "order123",
          userId: "user123",
          shopId: "shop123",
        },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it("returns 500 if GET throws error", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValue(new Error("DB fail"));

      const res = await GET({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({message: "Failed to fetch order"});
    });
  });

  // ============================ PATCH /api/orders/[orderId] ============================

  describe("PATCH", () => {
    // create a PATCH request
    const makePatchRequest = (body: any) =>
      new Request("http://localhost/api/orders/order123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

    it("returns 401 if not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const res = await PATCH(makePatchRequest({status: "COMPLETED"}) as any, {
        params,
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({message: "Not authenticated"});
    });

    it("returns 404 if no shop found", async () => {
      vi.mocked(db.shop.findFirst).mockResolvedValue(null);

      const res = await PATCH(makePatchRequest({status: "COMPLETED"}) as any, {
        params,
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({error: "No shop found"});
    });

    it("returns 400 if status is invalid", async () => {
      const res = await PATCH(makePatchRequest({status: "BAD_STATUS"}) as any, {
        params,
      });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({message: "Invalid status"});
    });

    it("returns 404 if order not found", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null);

      const res = await PATCH(makePatchRequest({status: "COMPLETED"}) as any, {
        params,
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({message: "Order not found"});
    });

    it("updates order status successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue({
        id: "order123",
        status: "PENDING",
      } as any);

      vi.mocked(db.order.update).mockResolvedValue({
        id: "order123",
        status: "COMPLETED",
        customer: null,
      } as any);

      const res = await PATCH(makePatchRequest({status: "COMPLETED"}) as any, {
        params,
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe("Order status updated");

      expect(db.order.update).toHaveBeenCalledWith({
        where: {id: "order123"},
        data: {
          status: "COMPLETED",
        },
        include: {
          customer: true,
        },
      });
    });

    it("returns 500 if PATCH throws error", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValue(new Error("DB fail"));

      const res = await PATCH(makePatchRequest({status: "COMPLETED"}) as any, {
        params,
      });
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({message: "Failed to update order"});
    });
  });

  // ============================ DELETE /api/orders/[orderId] ============================

  describe("DELETE", () => {
    it("returns 401 if not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const res = await DELETE({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({message: "Not authenticated"});
    });

    it("returns 404 if no shop found", async () => {
      vi.mocked(db.shop.findFirst).mockResolvedValue(null);

      const res = await DELETE({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({error: "No shop found"});
    });

    it("returns 404 if order not found", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null);

      const res = await DELETE({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({message: "Order not found"});
    });

    it("deletes order successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue({
        id: "order123",
      } as any);

      vi.mocked(db.order.delete).mockResolvedValue({
        id: "order123",
      } as any);

      const res = await DELETE({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({message: "Order deleted successfully"});

      expect(db.order.delete).toHaveBeenCalledWith({
        where: {id: "order123"},
      });
    });

    it("returns 500 if DELETE throws error", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValue(new Error("DB fail"));

      const res = await DELETE({} as any, {params});
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({message: "Failed to delete order"});
    });
  });
});
