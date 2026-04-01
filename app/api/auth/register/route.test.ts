import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockSaltAndHash, mockUserExists, mockCreateUser } = vi.hoisted(
  () => ({
    mockSaltAndHash: vi.fn(),
    mockUserExists: vi.fn(),
    mockCreateUser: vi.fn(),
  })
);

vi.mock("@/utils/password", () => ({
  saltAndHashPassword: (...args: unknown[]) => mockSaltAndHash(...args),
}));

vi.mock("@/lib/auth-utils", () => ({
  userExists: (...args: unknown[]) => mockUserExists(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
}));

import { POST } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(new URL("http://localhost:3000/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSaltAndHash.mockReturnValue("hashed-password");
});

// ===========================================================================
// POST /api/auth/register
// ===========================================================================
describe("POST /api/auth/register", () => {
  // ---- Validation ----
  describe("validation", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(buildRequest({ password: "secret123" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Email and password are required");
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(buildRequest({ email: "test@example.com" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Email and password are required");
    });

    it("returns 400 when password is shorter than 6 characters", async () => {
      const res = await POST(
        buildRequest({ email: "test@example.com", password: "12345" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe(
        "Password must be at least 6 characters long"
      );
    });

    it("accepts password that is exactly 6 characters", async () => {
      mockUserExists.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        firstName: null,
        lastName: null,
      });

      const res = await POST(
        buildRequest({ email: "a@b.com", password: "123456" })
      );

      expect(res.status).toBe(201);
    });
  });

  // ---- Duplicate user ----
  describe("duplicate user", () => {
    it("returns 409 when user already exists", async () => {
      mockUserExists.mockResolvedValue(true);

      const res = await POST(
        buildRequest({ email: "taken@example.com", password: "secret123" })
      );
      const body = await res.json();

      expect(res.status).toBe(409);
      expect(body.message).toBe("User already exists with this email");
    });

    it("checks existence before hashing password", async () => {
      mockUserExists.mockResolvedValue(true);

      await POST(
        buildRequest({ email: "taken@example.com", password: "secret123" })
      );

      expect(mockUserExists).toHaveBeenCalledWith("taken@example.com");
      expect(mockSaltAndHash).not.toHaveBeenCalled();
    });
  });

  // ---- Happy path ----
  describe("successful registration", () => {
    const requestBody = {
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
      password: "secret123",
    };

    const createdUser = {
      id: "u-new",
      firstName: "Alice",
      lastName: "Smith",
      email: "alice@example.com",
    };

    beforeEach(() => {
      mockUserExists.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue(createdUser);
    });

    it("returns 201 with user data", async () => {
      const res = await POST(buildRequest(requestBody));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.message).toBe("User created successfully");
      expect(body.user).toEqual({
        id: "u-new",
        firstName: "Alice",
        lastName: "Smith",
        email: "alice@example.com",
      });
    });

    it("does not expose the password in the response", async () => {
      const res = await POST(buildRequest(requestBody));
      const body = await res.json();

      expect(body.user.password).toBeUndefined();
    });

    it("hashes the password before creating the user", async () => {
      await POST(buildRequest(requestBody));

      expect(mockSaltAndHash).toHaveBeenCalledWith("secret123");
      expect(mockCreateUser).toHaveBeenCalledWith(
        "alice@example.com",
        "hashed-password",
        "Alice",
        "Smith"
      );
    });
  });

  // ---- createUser failure ----
  describe("createUser returns null", () => {
    it("returns 500 when createUser fails", async () => {
      mockUserExists.mockResolvedValue(false);
      mockCreateUser.mockResolvedValue(null);

      const res = await POST(
        buildRequest({ email: "a@b.com", password: "secret123" })
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.message).toBe("Failed to create user");
    });
  });

  // ---- Error handling ----
  describe("error handling", () => {
    it("returns 500 on unexpected error", async () => {
      mockUserExists.mockRejectedValue(new Error("DB down"));

      const res = await POST(
        buildRequest({ email: "a@b.com", password: "secret123" })
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.message).toBe("Internal server error");
    });
  });
});
