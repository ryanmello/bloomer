import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockUserFindUnique, mockUserUpdate, mockSendPasswordResetEmail } =
  vi.hoisted(() => ({
    mockUserFindUnique: vi.fn(),
    mockUserUpdate: vi.fn(),
    mockSendPasswordResetEmail: vi.fn(),
  }));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

vi.mock("@/lib/resend-email", () => ({
  sendPasswordResetEmail: (...args: unknown[]) =>
    mockSendPasswordResetEmail(...args),
}));

import { POST } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new URL("http://localhost:3000/api/auth/forgot-password"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

const MOCK_USER = {
  id: "user-1",
  email: "alice@example.com",
  firstName: "Alice",
};

const GENERIC_SUCCESS_MSG =
  "If an account exists with this email, a password reset link has been sent.";

beforeEach(() => {
  vi.clearAllMocks();
  mockUserUpdate.mockResolvedValue(undefined);
  mockSendPasswordResetEmail.mockResolvedValue({});
});

// ===========================================================================
// POST /api/auth/forgot-password
// ===========================================================================
describe("POST /api/auth/forgot-password", () => {
  // ---- Validation ----
  it("returns 400 when email is missing", async () => {
    const res = await POST(buildRequest({}));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Email is required");
  });

  // ---- Security: no user enumeration ----
  describe("user not found", () => {
    it("returns 200 with generic message when user does not exist", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      const res = await POST(buildRequest({ email: "unknown@example.com" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe(GENERIC_SUCCESS_MSG);
    });

    it("does not call update or send email when user not found", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await POST(buildRequest({ email: "unknown@example.com" }));

      expect(mockUserUpdate).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("lowercases the email before lookup", async () => {
      mockUserFindUnique.mockResolvedValue(null);

      await POST(buildRequest({ email: "Alice@Example.COM" }));

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { email: "alice@example.com" },
      });
    });
  });

  // ---- Happy path ----
  describe("user exists", () => {
    beforeEach(() => {
      mockUserFindUnique.mockResolvedValue(MOCK_USER);
    });

    it("saves a reset token with 1-hour expiry to the database", async () => {
      const before = Date.now();

      await POST(buildRequest({ email: "alice@example.com" }));

      expect(mockUserUpdate).toHaveBeenCalledTimes(1);
      const updateCall = mockUserUpdate.mock.calls[0][0];
      expect(updateCall.where).toEqual({ id: "user-1" });

      // Token should be a 64-char hex string (32 random bytes)
      expect(updateCall.data.passwordResetToken).toMatch(/^[a-f0-9]{64}$/);

      // Expiry should be ~1 hour from now
      const expiry = updateCall.data.passwordResetExpires as Date;
      const diffMs = expiry.getTime() - before;
      expect(diffMs).toBeGreaterThanOrEqual(55 * 60 * 1000); // at least 55 min
      expect(diffMs).toBeLessThanOrEqual(65 * 60 * 1000); // at most 65 min
    });

    it("calls sendPasswordResetEmail with correct args", async () => {
      await POST(buildRequest({ email: "alice@example.com" }));

      expect(mockSendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const [email, token, firstName] =
        mockSendPasswordResetEmail.mock.calls[0];
      expect(email).toBe("alice@example.com");
      expect(token).toMatch(/^[a-f0-9]{64}$/);
      expect(firstName).toBe("Alice");
    });

    it("passes undefined as firstName when user has no firstName", async () => {
      mockUserFindUnique.mockResolvedValue({
        ...MOCK_USER,
        firstName: null,
      });

      await POST(buildRequest({ email: "alice@example.com" }));

      const [, , firstName] = mockSendPasswordResetEmail.mock.calls[0];
      expect(firstName).toBeUndefined();
    });

    it("returns 200 with generic message on success", async () => {
      const res = await POST(buildRequest({ email: "alice@example.com" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe(GENERIC_SUCCESS_MSG);
    });
  });

  // ---- Email send failure ----
  describe("email sending fails", () => {
    it("returns 200 with generic message even when email send throws", async () => {
      mockUserFindUnique.mockResolvedValue(MOCK_USER);
      mockSendPasswordResetEmail.mockRejectedValue(
        new Error("SMTP connection refused")
      );

      const res = await POST(buildRequest({ email: "alice@example.com" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe(GENERIC_SUCCESS_MSG);
    });
  });

  // ---- Error handling ----
  describe("error handling", () => {
    it("returns 500 on unexpected error", async () => {
      mockUserFindUnique.mockRejectedValue(new Error("DB down"));

      const res = await POST(buildRequest({ email: "alice@example.com" }));
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.message).toBe("Internal server error");
    });
  });
});
