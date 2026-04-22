import db from "@/lib/prisma";

type GmailIntegrationRow = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  connected: boolean;
  email: string;
};

async function resolveGmailAccessToken(
  userId: string,
  integration: GmailIntegrationRow
): Promise<string> {
  let accessToken = integration.accessToken;

  if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
    if (!integration.refreshToken) {
      throw new Error("Token expired");
    }
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("Gmail OAuth not configured");
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: integration.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to refresh Gmail token");
    }

    const tokens = await res.json();
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await (db as any).emailIntegration.update({
      where: { userId_platform: { userId, platform: "gmail" } },
      data: { accessToken: tokens.access_token, expiresAt },
    });

    accessToken = tokens.access_token;
  }

  return accessToken;
}

export async function getGmailAccessToken(userId: string): Promise<string> {
  const integration = await (db as any).emailIntegration.findUnique({
    where: { userId_platform: { userId, platform: "gmail" } },
  });

  if (!integration || !integration.connected) {
    throw new Error("Gmail not connected");
  }

  return resolveGmailAccessToken(userId, integration);
}

/** Access token plus the connected mailbox address (for From: when sending). */
export async function getGmailSendContext(
  userId: string
): Promise<{ accessToken: string; fromEmail: string }> {
  const integration = await (db as any).emailIntegration.findUnique({
    where: { userId_platform: { userId, platform: "gmail" } },
  });

  if (!integration || !integration.connected) {
    throw new Error("Gmail not connected");
  }

  const accessToken = await resolveGmailAccessToken(userId, integration);
  return { accessToken, fromEmail: integration.email };
}
