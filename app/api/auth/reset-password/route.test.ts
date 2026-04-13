import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const { mockUserFindFirst, mockUserUpdate, mockSaltAndHash } = vi.hoisted(
  () => ({
    mockUserFindFirst: vi.fn(),
    mockUserUpdate: vi.fn(),
    mockSaltAndHash: vi.fn(),
  })
);

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

vi.mock("@/utils/password", () => ({
  saltAndHashPassword: (...args: unknown[]) => mockSaltAndHash(...args),
}));

import { POST } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    new URL("http://localhost:3000/api/auth/reset-password"),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

const MOCK_USER = { id: "user-1", email: "alice@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSaltAndHash.mockReturnValue("new-hashed-password");
  mockUserUpdate.mockResolvedValue(undefined);
});

// ===========================================================================
// POST /api/auth/reset-password
// ===========================================================================
describe("POST /api/auth/reset-password", () => {
  // ---- Validation ----
  describe("validation", () => {
    it("returns 400 when token is missing", async () => {
      const res = await POST(
        buildRequest({ password: "newpassword123" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Token and password are required");
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(buildRequest({ token: "abc123" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Token and password are required");
    });

    it("returns 400 when password is shorter than 6 characters", async () => {
      const res = await POST(
        buildRequest({ token: "abc123", password: "12345" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe(
        "Password must be at least 6 characters long"
      );
    });
  });

  // ---- Invalid / expired token ----
  describe("invalid or expired token", () => {
    it("returns 400 when no user matches the token", async () => {
      mockUserFindFirst.mockResolvedValue(null);

      const res = await POST(
        buildRequest({ token: "expired-token", password: "newpassword123" })
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.message).toBe("Invalid or expired reset token");
    });

    it("queries with gt: new Date() to check token expiry", async () => {
      mockUserFindFirst.mockResolvedValue(null);

      const before = Date.now();
      await POST(
        buildRequest({ token: "some-token", password: "newpassword123" })
      );

      const call = mockUserFindFirst.mock.calls[0][0];
      expect(call.where.passwordResetToken).toBe("some-token");

      const expiryCheck = call.where.passwordResetExpires.gt as Date;
      expect(expiryCheck.getTime()).toBeGreaterThanOrEqual(before);
      expect(expiryCheck.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("does not hash or update when token is invalid", async () => {
      mockUserFindFirst.mockResolvedValue(null);

      await POST(
        buildRequest({ token: "bad-token", password: "newpassword123" })
      );

      expect(mockSaltAndHash).not.toHaveBeenCalled();
      expect(mockUserUpdate).not.toHaveBeenCalled();
    });
  });

  // ---- Happy path ----
  describe("successful reset", () => {
    beforeEach(() => {
      mockUserFindFirst.mockResolvedValue(MOCK_USER);
    });

    it("hashes the new password and updates the user", async () => {
      await POST(
        buildRequest({ token: "valid-token", password: "newpassword123" })
      );

      expect(mockSaltAndHash).toHaveBeenCalledWith("newpassword123");
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: {
          password: "new-hashed-password",
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });
    });

    it("clears passwordResetToken and passwordResetExpires", async () => {
      await POST(
        buildRequest({ token: "valid-token", password: "newpassword123" })
      );

      const updateData = mockUserUpdate.mock.calls[0][0].data;
      expect(updateData.passwordResetToken).toBeNull();
      expect(updateData.passwordResetExpires).toBeNull();
    });

    it("returns 200 with success message", async () => {
      const res = await POST(
        buildRequest({ token: "valid-token", password: "newpassword123" })
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.message).toBe("Password has been reset successfully");
    });
  });

  // ---- Error handling ----
  describe("error handling", () => {
    it("returns 500 on unexpected error", async () => {
      mockUserFindFirst.mockRejectedValue(new Error("DB down"));

      const res = await POST(
        buildRequest({ token: "valid-token", password: "newpassword123" })
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.message).toBe("Internal server error");
    });
  });
});
