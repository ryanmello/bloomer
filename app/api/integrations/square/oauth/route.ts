import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";

const SQUARE_SCOPES = [
  "ORDERS_READ",
  "CUSTOMERS_READ",
  "MERCHANT_PROFILE_READ",
  "PAYMENTS_READ",
  "ITEMS_READ",
];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.SQUARE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: "Square OAuth not configured" },
        { status: 500 }
      );
    }

    const isSandbox = process.env.NODE_ENV !== "production";
    const authorizeBase = isSandbox
      ? "https://connect.squareupsandbox.com/oauth2/authorize"
      : "https://connect.squareup.com/oauth2/authorize";

    const state = Buffer.from(JSON.stringify({ userId: user.id }))
      .toString("base64url");

    const params = new URLSearchParams({
      client_id: clientId,
      scope: SQUARE_SCOPES.join(" "),
      state,
    });

    // session=false forces re-login; only supported in production, not sandbox
    if (!isSandbox) {
      params.set("session", "false");
    }

    const authUrl = `${authorizeBase}?${params.toString()}`;

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Square OAuth error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
