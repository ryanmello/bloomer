import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { getGmailAccessToken } from "@/lib/inbox-gmail";

export async function POST(
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
        { error: "Missing messageId" },
        { status: 400 }
      );
    }

    const accessToken = await getGmailAccessToken(user.id);

    const trashRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!trashRes.ok) {
      const errText = await trashRes.text();
      if (trashRes.status === 404) {
        return NextResponse.json(
          { error: "Message not found or access denied" },
          { status: 404 }
        );
      }
      if (trashRes.status === 403) {
        return NextResponse.json(
          { error: "Gmail permission denied" },
          { status: 403 }
        );
      }
      console.error("[Inbox Delete] Gmail error:", trashRes.status, errText);
      return NextResponse.json(
        { error: "Failed to delete. Gmail may have rate limited the request." },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete";
    if (msg.includes("not connected") || msg.includes("Token expired")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[Inbox Delete]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
