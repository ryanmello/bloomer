import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  mockShopFindFirst,
  mockCustomerFindMany,
  mockCustomerFindUnique,
  mockCustomerCreate,
  mockCustomerUpdate,
  mockCustomerDelete,
  mockGetCurrentUser,
  mockCookieGet,
  mockCreateAuditLog,
} = vi.hoisted(() => ({
  mockShopFindFirst: vi.fn(),
  mockCustomerFindMany: vi.fn(),
  mockCustomerFindUnique: vi.fn(),
  mockCustomerCreate: vi.fn(),
  mockCustomerUpdate: vi.fn(),
  mockCustomerDelete: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockCookieGet: vi.fn(),
  mockCreateAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    shop: { findFirst: mockShopFindFirst },
    customer: {
      findMany: mockCustomerFindMany,
      findUnique: mockCustomerFindUnique,
      create: mockCustomerCreate,
      update: mockCustomerUpdate,
      delete: mockCustomerDelete,
    },
  },
}));

vi.mock("@/actions/getCurrentUser", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
}));

vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}));

vi.mock("@/lib/audit", () => ({
  createAuditLog: (...args: unknown[]) => mockCreateAuditLog(...args),
}));

import { GET, POST, PUT, DELETE } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const MOCK_USER = { id: "user-1", email: "owner@example.com" };
const MOCK_SHOP = { id: "shop-1", userId: "user-1", name: "Test Shop" };

function buildRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost:3000/api/customer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Set up the standard authenticated + shop-resolved state. */
function setupAuthAndShop() {
  mockGetCurrentUser.mockResolvedValue(MOCK_USER);
  mockCookieGet.mockReturnValue(undefined);
  mockShopFindFirst.mockResolvedValue(MOCK_SHOP);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateAuditLog.mockResolvedValue(undefined);
});

// ===========================================================================
// GET /api/customer
// ===========================================================================
describe("GET /api/customer", () => {
  // ---- Authentication ----
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });

  // ---- Shop scoping ----
  it("returns 404 when user has no shop", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockShopFindFirst.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("No shop found");
  });

  it("uses activeShopId cookie when present", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue({ value: "shop-1" });
    mockShopFindFirst.mockResolvedValueOnce(MOCK_SHOP);
    mockCustomerFindMany.mockResolvedValue([]);

    await GET();

    expect(mockShopFindFirst).toHaveBeenCalledWith({
      where: { id: "shop-1", userId: "user-1" },
    });
  });

  it("falls back to first shop when cookie is missing", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockShopFindFirst.mockResolvedValueOnce(MOCK_SHOP);
    mockCustomerFindMany.mockResolvedValue([]);

    await GET();

    expect(mockShopFindFirst).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("falls back when cookie shop doesn't exist", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue({ value: "deleted-shop" });
    mockShopFindFirst.mockResolvedValueOnce(null); // cookie lookup fails
    mockShopFindFirst.mockResolvedValueOnce(MOCK_SHOP); // fallback
    mockCustomerFindMany.mockResolvedValue([]);

    await GET();

    expect(mockShopFindFirst).toHaveBeenCalledTimes(2);
  });

  // ---- Happy path ----
  it("returns customers scoped to the shop with addresses and orders", async () => {
    setupAuthAndShop();
    const customers = [
      { id: "c1", firstName: "Alice", addresses: [], orders: [] },
    ];
    mockCustomerFindMany.mockResolvedValue(customers);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(customers);
    expect(mockCustomerFindMany).toHaveBeenCalledWith({
      where: { shopId: "shop-1" },
      include: { addresses: true, orders: true },
    });
  });

  // ---- Error handling ----
  it("returns empty array on unexpected error", async () => {
    mockGetCurrentUser.mockRejectedValue(new Error("DB down"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });
});

// ===========================================================================
// POST /api/customer
// ===========================================================================
describe("POST /api/customer", () => {
  // ---- Authentication ----
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(buildRequest({ email: "test@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });

  // ---- Shop scoping ----
  it("returns 404 when user has no shop", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockShopFindFirst.mockResolvedValue(null);

    const res = await POST(buildRequest({ email: "test@example.com" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("No shop found");
  });

  // ---- Validation ----
  it("returns 400 when email already exists", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue({ id: "existing" });

    const res = await POST(
      buildRequest({
        firstName: "Alice",
        lastName: "Smith",
        email: "taken@example.com",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Customer already exists!");
  });

  // ---- Happy path ----
  it("creates customer with correct fields and returns 201", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue(null);
    const created = {
      id: "c-new",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
      addresses: [],
    };
    mockCustomerCreate.mockResolvedValue(created);

    const res = await POST(
      buildRequest({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
        phoneNumber: "555-1234",
        additionalNote: "VIP",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toBe("Customer created successfully!");
    expect(body.customer).toEqual(created);

    expect(mockCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@example.com",
          phoneNumber: "555-1234",
          additionalNote: "VIP",
          shopId: "shop-1",
          group: "new",
          dateOfBirth: null,
          birthMonth: null,
          birthDay: null,
        }),
      })
    );
  });

  it("defaults group to 'new' when not provided", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue(null);
    mockCustomerCreate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [],
    });

    await POST(
      buildRequest({ firstName: "A", lastName: "B", email: "a@b.com" })
    );

    expect(mockCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ group: "new" }),
      })
    );
  });

  it("uses provided group when given", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue(null);
    mockCustomerCreate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [],
    });

    await POST(
      buildRequest({
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        group: "vip",
      })
    );

    expect(mockCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ group: "vip" }),
      })
    );
  });

  it("parses dateOfBirth and derives birthMonth and birthDay", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue(null);
    mockCustomerCreate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [],
    });

    const dobString = "1998-03-21";
    await POST(
      buildRequest({
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        dateOfBirth: dobString,
      })
    );

    // The route uses `new Date(dateOfBirth)` which is timezone-dependent.
    // Derive expected values the same way the source does.
    const expectedDob = new Date(dobString);
    const call = mockCustomerCreate.mock.calls[0][0];
    expect(call.data.dateOfBirth).toBeInstanceOf(Date);
    expect(call.data.birthMonth).toBe(expectedDob.getMonth() + 1);
    expect(call.data.birthDay).toBe(expectedDob.getDate());
  });

  it("sets dateOfBirth fields to null when dateOfBirth is absent", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue(null);
    mockCustomerCreate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [],
    });

    await POST(
      buildRequest({ firstName: "A", lastName: "B", email: "a@b.com" })
    );

    const call = mockCustomerCreate.mock.calls[0][0];
    expect(call.data.dateOfBirth).toBeNull();
    expect(call.data.birthMonth).toBeNull();
    expect(call.data.birthDay).toBeNull();
  });

  it("creates address when address field is provided", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue(null);
    const addr = {
      line1: "123 Main",
      city: "Portland",
      state: "OR",
      zip: "97201",
      country: "US",
    };
    mockCustomerCreate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [addr],
    });

    await POST(
      buildRequest({
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        address: addr,
      })
    );

    expect(mockCustomerCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          addresses: { create: addr },
        }),
      })
    );
  });

  // ---- Audit logging ----
  it("calls createAuditLog with CUSTOMER_CREATE on success", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockResolvedValue(null);
    mockCustomerCreate.mockResolvedValue({
      id: "c-new",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
      addresses: [],
    });

    await POST(
      buildRequest({
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
      })
    );

    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      action: "CUSTOMER_CREATE",
      userId: "user-1",
      targetId: "c-new",
      targetType: "Customer",
      metadata: { email: "alice@example.com", name: "Alice Smith" },
    });
  });

  // ---- Error handling ----
  it("returns 500 on unexpected error", async () => {
    setupAuthAndShop();
    mockCustomerFindUnique.mockRejectedValue(new Error("DB error"));

    const res = await POST(
      buildRequest({
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to create customer");
  });
});

// ===========================================================================
// PUT /api/customer
// ===========================================================================
describe("PUT /api/customer", () => {
  // ---- Authentication ----
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await PUT(buildRequest({ id: "c1" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });

  // ---- Validation ----
  it("returns 400 when id is missing", async () => {
    setupAuthAndShop();

    const res = await PUT(
      buildRequest({ firstName: "Alice", lastName: "Smith" })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Customer ID is required");
  });

  // ---- Happy path ----
  it("updates customer fields and returns updated customer", async () => {
    setupAuthAndShop();
    const updated = {
      id: "c1",
      firstName: "Alice",
      lastName: "Jones",
      email: "alice@example.com",
      addresses: [],
    };
    mockCustomerUpdate.mockResolvedValue(updated);

    const res = await PUT(
      buildRequest({
        id: "c1",
        firstName: "Alice",
        lastName: "Jones",
        email: "alice@example.com",
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Customer updated successfully");
    expect(body.customer).toEqual(updated);
  });

  it("replaces addresses with deleteMany + create when addresses provided", async () => {
    setupAuthAndShop();
    const newAddrs = [
      {
        line1: "456 Oak",
        city: "Seattle",
        state: "WA",
        zip: "98101",
        country: "US",
      },
    ];
    mockCustomerUpdate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: newAddrs,
    });

    await PUT(
      buildRequest({
        id: "c1",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        addresses: newAddrs,
      })
    );

    expect(mockCustomerUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          addresses: { deleteMany: {}, create: newAddrs },
        }),
      })
    );
  });

  it("does not touch addresses when addresses field is not provided", async () => {
    setupAuthAndShop();
    mockCustomerUpdate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [],
    });

    await PUT(
      buildRequest({ id: "c1", firstName: "A", lastName: "B", email: "a@b.com" })
    );

    const call = mockCustomerUpdate.mock.calls[0][0];
    expect(call.data.addresses).toBeUndefined();
  });

  it("parses dateOfBirth with parseISO and derives month/day", async () => {
    setupAuthAndShop();
    mockCustomerUpdate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [],
    });

    await PUT(
      buildRequest({
        id: "c1",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        dateOfBirth: "1990-12-25",
      })
    );

    const call = mockCustomerUpdate.mock.calls[0][0];
    expect(call.data.dateOfBirth).toBeInstanceOf(Date);
    expect(call.data.birthMonth).toBe(12);
    expect(call.data.birthDay).toBe(25);
  });

  it("sets dateOfBirth to null when dateOfBirth is empty string", async () => {
    setupAuthAndShop();
    mockCustomerUpdate.mockResolvedValue({
      id: "c1",
      firstName: "A",
      lastName: "B",
      email: "a@b.com",
      addresses: [],
    });

    await PUT(
      buildRequest({
        id: "c1",
        firstName: "A",
        lastName: "B",
        email: "a@b.com",
        dateOfBirth: "  ",
      })
    );

    const call = mockCustomerUpdate.mock.calls[0][0];
    expect(call.data.dateOfBirth).toBeNull();
    expect(call.data.birthMonth).toBeNull();
    expect(call.data.birthDay).toBeNull();
  });

  // ---- Audit logging ----
  it("calls createAuditLog with CUSTOMER_UPDATE on success", async () => {
    setupAuthAndShop();
    mockCustomerUpdate.mockResolvedValue({
      id: "c1",
      firstName: "Alice",
      lastName: "Jones",
      email: "alice@example.com",
      addresses: [],
    });

    await PUT(
      buildRequest({
        id: "c1",
        firstName: "Alice",
        lastName: "Jones",
        email: "alice@example.com",
      })
    );

    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      action: "CUSTOMER_UPDATE",
      userId: "user-1",
      targetId: "c1",
      targetType: "Customer",
      metadata: { email: "alice@example.com", name: "Alice Jones" },
    });
  });

  // ---- Error handling ----
  it("returns 500 on unexpected error", async () => {
    setupAuthAndShop();
    mockCustomerUpdate.mockRejectedValue(new Error("DB error"));

    const res = await PUT(
      buildRequest({ id: "c1", firstName: "A", lastName: "B", email: "a@b.com" })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to update customer");
  });
});

// ===========================================================================
// DELETE /api/customer
// ===========================================================================
describe("DELETE /api/customer", () => {
  // ---- Authentication ----
  it("returns 401 when user is not authenticated", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await DELETE(buildRequest({ id: "c1" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.message).toBe("Not authenticated");
  });

  // ---- Shop scoping ----
  it("returns 404 when user has no shop", async () => {
    mockGetCurrentUser.mockResolvedValue(MOCK_USER);
    mockCookieGet.mockReturnValue(undefined);
    mockShopFindFirst.mockResolvedValue(null);

    const res = await DELETE(buildRequest({ id: "c1" }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("No shop found");
  });

  // ---- Validation ----
  it("returns 400 when id is missing", async () => {
    setupAuthAndShop();

    const res = await DELETE(buildRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Customer ID is required");
  });

  // ---- Happy path ----
  it("deletes the customer and returns success message", async () => {
    setupAuthAndShop();
    mockCustomerDelete.mockResolvedValue({ id: "c1" });

    const res = await DELETE(buildRequest({ id: "c1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe("Customer deleted successfully");
    expect(mockCustomerDelete).toHaveBeenCalledWith({ where: { id: "c1" } });
  });

  // ---- Audit logging ----
  it("calls createAuditLog with CUSTOMER_DELETE on success", async () => {
    setupAuthAndShop();
    mockCustomerDelete.mockResolvedValue({ id: "c1" });

    await DELETE(buildRequest({ id: "c1" }));

    expect(mockCreateAuditLog).toHaveBeenCalledWith({
      action: "CUSTOMER_DELETE",
      userId: "user-1",
      targetId: "c1",
      targetType: "Customer",
    });
  });

  // ---- Authorization gap ----
  it("does NOT scope delete to the user's shop (documents current behavior)", async () => {
    setupAuthAndShop();
    mockCustomerDelete.mockResolvedValue({ id: "other-shop-customer" });

    await DELETE(buildRequest({ id: "other-shop-customer" }));

    // The delete call only uses { id } -- no shopId or userId check.
    // Compare with orders route which scopes with userId + shopId.
    expect(mockCustomerDelete).toHaveBeenCalledWith({
      where: { id: "other-shop-customer" },
    });
  });

  // ---- Error handling ----
  it("returns 500 on unexpected error", async () => {
    setupAuthAndShop();
    mockCustomerDelete.mockRejectedValue(new Error("DB error"));

    const res = await DELETE(buildRequest({ id: "c1" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Failed to delete customer");
  });
});
