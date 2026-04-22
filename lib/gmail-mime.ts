import { randomBytes } from "crypto";

const CRLF = "\r\n";

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function foldBase64(b64: string): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 76) {
    lines.push(b64.slice(i, i + 76));
  }
  return lines.join(CRLF);
}

function encodeSubject(subject: string): string {
  const safe = subject.replace(/\r|\n/g, " ").slice(0, 500);
  if (!/[^\x00-\x7F]/.test(safe)) return safe;
  return `=?UTF-8?B?${Buffer.from(safe, "utf8").toString("base64")}?=`;
}

function sanitizeHeaderValue(value: string): string {
  return value.replace(/\r|\n/g, " ").trim();
}

function escapeMimeFilename(name: string): string {
  return name.replace(/[\r\n"]/g, "_").replace(/\\/g, "_").slice(0, 200) || "attachment";
}

function textPartBase64(mime: "text/plain" | "text/html", body: string): string {
  const b64 = Buffer.from(body, "utf8").toString("base64");
  return [
    `Content-Type: ${mime}; charset=UTF-8`,
    "Content-Transfer-Encoding: base64",
    "",
    foldBase64(b64),
  ].join(CRLF);
}

export type GmailAttachmentPart = {
  filename: string;
  contentType: string;
  bytes: Buffer;
};

export type BuildGmailMessageInput = {
  fromEmail: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  bodyPlain: string;
  bodyHtml?: string;
  attachments: GmailAttachmentPart[];
};

/**
 * Builds an RFC 2822 message and returns Gmail API `raw` (base64url).
 */
export function buildGmailRawMessage(input: BuildGmailMessageInput): string {
  const from = sanitizeHeaderValue(input.fromEmail);
  const to = sanitizeHeaderValue(input.to);
  const cc = input.cc ? sanitizeHeaderValue(input.cc) : "";
  const bcc = input.bcc ? sanitizeHeaderValue(input.bcc) : "";
  const subject = encodeSubject(input.subject.replace(/\r|\n/g, " "));
  const plain = input.bodyPlain || "";
  const html = (input.bodyHtml || "").trim();
  const attachments = input.attachments || [];

  const hasAttachments = attachments.length > 0;
  const hasHtml = html.length > 0;

  let mime: string;

  if (!hasAttachments && !hasHtml) {
    mime = [
      `From: ${from}`,
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      ...(bcc ? [`Bcc: ${bcc}`] : []),
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      textPartBase64("text/plain", plain),
    ].join(CRLF);
  } else if (!hasAttachments && hasHtml) {
    const bAlt = `alt_${randomBytes(12).toString("hex")}`;
    mime = [
      `From: ${from}`,
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      ...(bcc ? [`Bcc: ${bcc}`] : []),
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${bAlt}"`,
      "",
      `--${bAlt}`,
      textPartBase64("text/plain", plain),
      `--${bAlt}`,
      textPartBase64("text/html", html),
      `--${bAlt}--`,
    ].join(CRLF);
  } else {
    const bMixed = `mixed_${randomBytes(12).toString("hex")}`;
    const innerParts: string[] = [];

    if (hasHtml) {
      const bAlt = `alt_${randomBytes(12).toString("hex")}`;
      innerParts.push(
        [
          `Content-Type: multipart/alternative; boundary="${bAlt}"`,
          "",
          `--${bAlt}`,
          textPartBase64("text/plain", plain),
          `--${bAlt}`,
          textPartBase64("text/html", html),
          `--${bAlt}--`,
        ].join(CRLF)
      );
    } else {
      innerParts.push(textPartBase64("text/plain", plain));
    }

    const attBlocks = attachments.map((att) => {
      const fn = escapeMimeFilename(att.filename);
      const ct = att.contentType || "application/octet-stream";
      const b64 = foldBase64(att.bytes.toString("base64"));
      return [
        `--${bMixed}`,
        `Content-Type: ${ct}; name="${fn}"`,
        `Content-Disposition: attachment; filename="${fn}"`,
        "Content-Transfer-Encoding: base64",
        "",
        b64,
      ].join(CRLF);
    });

    mime = [
      `From: ${from}`,
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      ...(bcc ? [`Bcc: ${bcc}`] : []),
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${bMixed}"`,
      "",
      `--${bMixed}`,
      innerParts.join(CRLF),
      ...attBlocks,
      `--${bMixed}--`,
    ].join(CRLF);
  }

  return base64UrlEncode(Buffer.from(mime, "utf8"));
}
