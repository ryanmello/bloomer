import { describe, it, beforeEach, expect, vi } from "vitest";

vi.mock("../../../lib/prisma", () => ({
  default: {
    shop: {
      findFirst: vi.fn(),
    },
    audience: {
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
    campaign: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    campaignRecipient: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import db from "../../../lib/prisma";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { GET, POST, DELETE } from "./route";

const mockUser = { id: "user123" };
const mockShop = { id: "shop123", userId: "user123" };

const createRequest = (body: any, method: string) =>
  new Request("http://localhost/api/audience", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const mockCookieStore = (value: string | null) => {
  vi.mocked(cookies).mockResolvedValueOnce({
    get: vi.fn().mockReturnValue(value ? { value } : undefined),
  } as any);
};

function assertResponse(res: Response | undefined): asserts res is Response {
  if (!res) throw new Error("Expected response to be defined");
}

describe("/api/audience route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any);
    vi.mocked(cookies).mockResolvedValue({ get: vi.fn().mockReturnValue({ value: "shop123" }) } as any);
    vi.mocked(db.shop.findFirst).mockResolvedValue(mockShop as any);
  });

  describe("GET", () => {
    it("returns 401 when the user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null as any);

      const res = await GET();
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ message: "Not authenticated" });
    });

    it("returns 404 when no shop is found", async () => {
      vi.mocked(db.shop.findFirst).mockResolvedValue(null as any);

      const res = await GET();
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({ error: "No shop found" });
    });

    it("returns audience metrics successfully", async () => {
      vi.mocked(db.audience.findMany).mockResolvedValue([
        {
          id: "aud-1",
          shopId: "shop123",
          type: "custom",
          customerIds: ["cust-1"],
          name: "VIP Buyers",
          description: "High value customers",
          status: "active",
          field: null,
        },
      ] as any);

      vi.mocked(db.customer.findMany).mockResolvedValue([
        {
          id: "cust-1",
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          orderCount: 3,
          spendAmount: 250,
        },
      ] as any);

      vi.mocked(db.campaign.count).mockResolvedValue(2 as any);
      vi.mocked(db.campaign.findFirst).mockResolvedValue({
        campaignName: "Spring Launch",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      } as any);
      vi.mocked(db.campaignRecipient.count)
        .mockResolvedValueOnce(10 as any)
        .mockResolvedValueOnce(5 as any);

      const res = await GET();
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body[0]).toEqual(
        expect.objectContaining({
          id: "aud-1",
          customerCount: 1,
          campaignsSent: 2,
          lastCampaignName: "Spring Launch",
          engagementRate: 50,
        }),
      );
    });
  });

  describe("POST", () => {
    it("returns 401 when the user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null as any);

      const req = createRequest({ name: "New Audience" }, "POST");
      const res = await POST(req);
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ message: "Not authenticated" });
    });

    it("returns 404 when no shop is found", async () => {
      vi.mocked(db.shop.findFirst).mockResolvedValue(null as any);

      const req = createRequest({ name: "New Audience" }, "POST");
      const res = await POST(req);
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({ error: "No shop found" });
    });

    it("creates a new audience and returns status 201", async () => {
      vi.mocked(db.audience.create).mockResolvedValue({
        id: "aud-2",
        name: "New Audience",
        description: "New audience description",
        status: "active",
        type: "custom",
        field: null,
        customerIds: ["cust-1"],
        userId: "user123",
        shopId: "shop123",
      } as any);

      const req = createRequest(
        {
          name: "New Audience",
          description: "New audience description",
          status: "active",
          type: "custom",
          field: null,
          customerIds: ["cust-1"],
        },
        "POST",
      );

      const res = await POST(req);
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toEqual(
        expect.objectContaining({
          message: "Audience created successfully!",
          audience: expect.objectContaining({ id: "aud-2" }),
        }),
      );
      expect(db.audience.create).toHaveBeenCalledWith({
        data: {
          name: "New Audience",
          description: "New audience description",
          status: "active",
          type: "custom",
          field: null,
          customerIds: ["cust-1"],
          userId: "user123",
          shopId: "shop123",
        },
      });
    });
  });

  describe("DELETE", () => {
    it("returns 400 when no id or ids are provided", async () => {
      const req = createRequest({}, "DELETE");
      const res = await DELETE(req);
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ error: "Audience ID(s) are required" });
    });

    it("deletes a single audience by id", async () => {
      vi.mocked(db.audience.findFirst)
        .mockResolvedValueOnce({ id: "aud-1", shopId: "shop123" } as any)
        .mockResolvedValueOnce({} as any);
      vi.mocked(db.audience.delete).mockResolvedValue({} as any);

      const req = createRequest({ id: "aud-1" }, "DELETE");
      const res = await DELETE(req);
      assertResponse(res);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ message: "Audience deleted successfully!" });
      expect(db.audience.delete).toHaveBeenCalledWith({ where: { id: "aud-1" } });
    });
  });
});
