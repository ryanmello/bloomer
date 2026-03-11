import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=missing_params`
      );
    }

    const { userId } = JSON.parse(
      Buffer.from(state, "base64url").toString()
    );

    const clientId = process.env.SQUARE_CLIENT_ID;
    const clientSecret = process.env.SQUARE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${baseUrl}/settings?error=square_not_configured`
      );
    }

    const isSandbox = process.env.NODE_ENV !== "production";
    const tokenUrl = isSandbox
      ? "https://connect.squareupsandbox.com/oauth2/token"
      : "https://connect.squareup.com/oauth2/token";

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Square token exchange error:", errorData);
      return NextResponse.redirect(
        `${baseUrl}/settings?error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const {
      access_token,
      refresh_token,
      expires_at,
      merchant_id,
    } = tokens;

    const expiresAt = new Date(expires_at);

    const existing = await db.squareIntegration.findUnique({
      where: { userId },
    });

    if (existing) {
      await db.squareIntegration.update({
        where: { id: existing.id },
        data: {
          merchantId: merchant_id,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          connected: true,
        },
      });
    } else {
      await db.squareIntegration.create({
        data: {
          userId,
          merchantId: merchant_id,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          connected: true,
        },
      });
    }

    return NextResponse.redirect(
      `${baseUrl}/settings?connected=square`
    );
  } catch (error: any) {
    console.error("Square callback error:", error);
    return NextResponse.redirect(
      `${baseUrl}/settings?error=${encodeURIComponent(error.message)}`
    );
  }
}
