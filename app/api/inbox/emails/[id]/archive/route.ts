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

    const body = await request.json().catch(() => ({}));
    const archive = body.archive ?? true;

    const accessToken = await getGmailAccessToken(user.id);

    const modifyRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          archive
            ? { removeLabelIds: ["INBOX"] }
            : { addLabelIds: ["INBOX"] }
        ),
      }
    );

    if (!modifyRes.ok) {
      const errText = await modifyRes.text();
      if (modifyRes.status === 404) {
        return NextResponse.json(
          { error: "Message not found or access denied" },
          { status: 404 }
        );
      }
      if (modifyRes.status === 403) {
        return NextResponse.json(
          { error: "Gmail permission denied" },
          { status: 403 }
        );
      }
      console.error("[Inbox Archive] Gmail error:", modifyRes.status, errText);
      return NextResponse.json(
        { error: "Failed to archive" },
        { status: 500 }
      );
    }

    const updated = await modifyRes.json();
    const archived = !(updated.labelIds || []).includes("INBOX");

    return NextResponse.json({ archived });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to archive";
    if (msg.includes("not connected") || msg.includes("Token expired")) {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("[Inbox Archive]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
