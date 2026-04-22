import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { getGmailSendContext } from "@/lib/inbox-gmail";
import { buildGmailRawMessage, type GmailAttachmentPart } from "@/lib/gmail-mime";

const MAX_ATTACHMENTS = 12;
const MAX_BYTES_PER_FILE = 15 * 1024 * 1024;
const MAX_TOTAL_ATTACH = 22 * 1024 * 1024;

function parseAddressList(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAddresses(label: string, raw: string): string | null {
  if (!raw.trim()) return null;
  for (const addr of parseAddressList(raw)) {
    const bracket = addr.match(/^(.+?)\s*<([^>]+)>$/);
    const email = bracket ? bracket[2].trim() : addr.trim();
    if (!EMAIL_RE.test(email)) {
      return `Invalid ${label} address: ${addr}`;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Use multipart/form-data with fields to, subject, body, optional cc, bcc, bodyHtml, and file fields named attachments." },
        { status: 400 }
      );
    }

    const form = await request.formData();
    const to = String(form.get("to") ?? "").trim();
    const cc = String(form.get("cc") ?? "").trim();
    const bcc = String(form.get("bcc") ?? "").trim();
    const subject = String(form.get("subject") ?? "").trim();
    const bodyPlain = String(form.get("body") ?? "");
    const bodyHtml = String(form.get("bodyHtml") ?? "").trim();

    if (!to) {
      return NextResponse.json({ error: "Recipient (to) is required." }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: "Subject is required." }, { status: 400 });
    }

    const errTo = validateAddresses("To", to);
    if (errTo) return NextResponse.json({ error: errTo }, { status: 400 });
    const errCc = validateAddresses("Cc", cc);
    if (errCc) return NextResponse.json({ error: errCc }, { status: 400 });
    const errBcc = validateAddresses("Bcc", bcc);
    if (errBcc) return NextResponse.json({ error: errBcc }, { status: 400 });

    const attachmentFiles = form.getAll("attachments").filter((v): v is File => v instanceof File);

    if (attachmentFiles.length > MAX_ATTACHMENTS) {
      return NextResponse.json(
        { error: `At most ${MAX_ATTACHMENTS} attachments are allowed.` },
        { status: 400 }
      );
    }

    let totalAttach = 0;
    const attachments: GmailAttachmentPart[] = [];

    for (const file of attachmentFiles) {
      if (!file.size) continue;
      if (file.size > MAX_BYTES_PER_FILE) {
        return NextResponse.json(
          { error: `Attachment "${file.name}" exceeds ${MAX_BYTES_PER_FILE / (1024 * 1024)} MB.` },
          { status: 400 }
        );
      }
      totalAttach += file.size;
      if (totalAttach > MAX_TOTAL_ATTACH) {
        return NextResponse.json(
          { error: "Total attachment size is too large for Gmail." },
          { status: 400 }
        );
      }
      const buf = Buffer.from(await file.arrayBuffer());
      attachments.push({
        filename: file.name || "attachment",
        contentType: file.type || "application/octet-stream",
        bytes: buf,
      });
    }

    let accessToken: string;
    let fromEmail: string;
    try {
      ({ accessToken, fromEmail } = await getGmailSendContext(user.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gmail not connected";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const raw = buildGmailRawMessage({
      fromEmail,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      bodyPlain: bodyPlain || "",
      bodyHtml: bodyHtml || undefined,
      attachments,
    });

    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!sendRes.ok) {
      const text = await sendRes.text();
      let message = text;
      try {
        const j = JSON.parse(text) as { error?: { message?: string } };
        if (j?.error?.message) message = j.error.message;
      } catch {
        /* keep text */
      }
      if (sendRes.status === 403 && /insufficient|permission|scope/i.test(message)) {
        return NextResponse.json(
          {
            error:
              "Gmail does not allow sending with the current connection. Disconnect Gmail and connect again so Bloomer can request send permission.",
          },
          { status: 403 }
        );
      }
      console.error("[inbox/send] Gmail API error:", sendRes.status, text);
      return NextResponse.json({ error: message || "Failed to send email" }, { status: 502 });
    }

    const data = (await sendRes.json()) as { id?: string; threadId?: string };
    return NextResponse.json({
      ok: true,
      messageId: data.id,
      threadId: data.threadId,
    });
  } catch (err) {
    console.error("[inbox/send]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send" },
      { status: 500 }
    );
  }
}
