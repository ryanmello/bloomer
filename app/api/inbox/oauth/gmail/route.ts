import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("[Gmail OAuth] Missing GOOGLE_CLIENT_ID");
      return NextResponse.json({ error: "Gmail OAuth not configured" }, { status: 500 });
    }

    // Use request origin for redirect - works on Vercel, local, and custom domains
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = request.headers.get("host") || "";
    const originHeader = request.headers.get("origin");
    const isLocalhost = host.includes("localhost") || host.startsWith("127.0.0.1");
    const baseUrl =
      forwardedProto && forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : isLocalhost
          ? `http://${host}`
          : originHeader ||
            process.env.NEXTAUTH_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            process.env.NEXT_PUBLIC_APP_URL ||
            "http://localhost:3000";
    const redirectUri = `${baseUrl.replace(/\/$/, "")}/api/inbox/oauth/gmail/callback`;
    console.log("[Gmail OAuth] Using redirect_uri:", redirectUri, "(add this exact URL to Google Console)");

    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" ");

    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64");

    // prompt=select_account ensures user can choose which Gmail account to connect
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=select_account%20consent&` +
      `state=${state}`;

    return NextResponse.json({ authUrl });
  } catch (error: unknown) {
    console.error("[Gmail OAuth] Start error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start Gmail connection" },
      { status: 500 }
    );
  }
}

