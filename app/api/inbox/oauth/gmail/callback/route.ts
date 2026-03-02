import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";

function getBaseUrl(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = request.headers.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.startsWith("127.0.0.1");
  if (isLocalhost) {
    return `http://${host}`;
  }
  const url = new URL(request.url);
  return url.origin;
}

function getUserFriendlyError(code: string): string {
  const map: Record<string, string> = {
    access_denied: "You declined access. You can connect again when ready.",
    missing_params: "Invalid response from Google. Please try again.",
    token_exchange_failed: "We couldn't complete the connection. Please try again.",
  };
  return map[code] || code;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const inboxUrl = `${baseUrl.replace(/\/$/, "")}/inbox`;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("[Gmail Callback] OAuth error from Google:", error);
      return NextResponse.redirect(
        `${inboxUrl}?error=${encodeURIComponent(getUserFriendlyError(error))}`
      );
    }

    if (!code || !state) {
      console.error("[Gmail Callback] Missing code or state");
      return NextResponse.redirect(
        `${inboxUrl}?error=${encodeURIComponent(getUserFriendlyError("missing_params"))}`
      );
    }

    let userId: string;
    try {
      ({ userId } = JSON.parse(Buffer.from(state, "base64").toString()));
    } catch {
      console.error("[Gmail Callback] Invalid state");
      return NextResponse.redirect(
        `${inboxUrl}?error=${encodeURIComponent(getUserFriendlyError("missing_params"))}`
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      console.error("[Gmail Callback] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
      return NextResponse.redirect(
        `${inboxUrl}?error=${encodeURIComponent("Gmail integration is not configured.")}`
      );
    }

    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/inbox/oauth/gmail/callback`;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      let parsed: { error?: string } = {};
      try {
        parsed = JSON.parse(errorData);
      } catch {}
      console.error(
        "[Gmail Callback] Token exchange failed:",
        tokenResponse.status,
        errorData,
        "redirect_uri used:",
        redirectUri
      );
      const isRedirectMismatch = parsed?.error === "redirect_uri_mismatch";
      const userMessage = isRedirectMismatch
        ? `Redirect URI mismatch. Add this exact URL to Google Console: ${redirectUri}`
        : getUserFriendlyError("token_exchange_failed");
      return NextResponse.redirect(`${inboxUrl}?error=${encodeURIComponent(userMessage)}`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userInfo = await userInfoResponse.json();
    const email = userInfo.email || "unknown";

    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

    const existing = await (db as any).emailIntegration.findUnique({
      where: { userId_platform: { userId, platform: "gmail" } },
    });

    if (existing) {
      await (db as any).emailIntegration.update({
        where: { id: existing.id },
        data: {
          email,
          accessToken: access_token,
          refreshToken: refresh_token ?? existing.refreshToken,
          expiresAt,
          connected: true,
        },
      });
    } else {
      await (db as any).emailIntegration.create({
        data: {
          userId,
          platform: "gmail",
          email,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          connected: true,
        },
      });
    }

    return NextResponse.redirect(`${inboxUrl}?connected=gmail`);
  } catch (err) {
    console.error("[Gmail Callback] Error:", err);
    const message = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(`${inboxUrl}?error=${encodeURIComponent(message)}`);
  }
}


