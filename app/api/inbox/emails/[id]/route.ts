import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { getGmailAccessToken } from "@/lib/inbox-gmail";

/**
 * GET /api/inbox/emails/[id]
 * Fetches full email content for display
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;
    if (!messageId) {
      return NextResponse.json(
        { error: "Missing message ID" },
        { status: 400 }
      );
    }

    const accessToken = await getGmailAccessToken(user.id);

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 404) {
        return NextResponse.json(
          { error: "Message not found or access denied" },
          { status: 404 }
        );
      }
      if (res.status === 403) {
        return NextResponse.json(
          { error: "Gmail permission denied" },
          { status: 403 }
        );
      }
      console.error("[Inbox Email] Gmail error:", res.status, errText);
      return NextResponse.json(
        { error: "Failed to fetch email" },
        { status: 500 }
      );
    }

    const msgData = await res.json();
    const headers = msgData.payload?.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: { name: string; value: string }) => h.name === name)
        ?.value || "";

    let bodyHtml: string | null = null;
    let bodyPlain: string | null = null;
    const payload = msgData.payload || {};

    const decodeBody = (data: string): string | null => {
      try {
        return Buffer.from(data, "base64url").toString("utf-8");
      } catch {
        try {
          return Buffer.from(data, "base64").toString("utf-8");
        } catch {
          return null;
        }
      }
    };

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.body?.data) {
          const decoded = decodeBody(part.body.data);
          if (decoded) {
            const mime = (part.mimeType || "").toLowerCase();
            if (mime === "text/html") bodyHtml = decoded;
            else if (mime === "text/plain") bodyPlain = decoded;
          }
        }
      }
    }
    if (!bodyHtml && !bodyPlain && payload.body?.data) {
      const decoded = decodeBody(payload.body.data);
      if (decoded) bodyPlain = decoded;
    }

    return NextResponse.json({
      id: msgData.id,
      from: getHeader("From"),
      to: getHeader("To"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      snippet: msgData.snippet || "",
      bodyHtml,
      bodyPlain,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch email";
    if (msg.includes("not connected") || msg.includes("Token expired")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[Inbox Email]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
