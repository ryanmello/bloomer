import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

async function refreshGmailToken(userId: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Gmail token');
  }

  const tokens = await response.json();
  const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

  await (db as any).emailIntegration.update({
    where: {
      userId_platform: {
        userId,
        platform: 'gmail',
      },
    },
    data: {
      accessToken: tokens.access_token,
      expiresAt,
    },
  });

  return tokens.access_token;
}

async function refreshOutlookToken(userId: string, refreshToken: string) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Outlook token');
  }

  const tokens = await response.json();
  const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

  await (db as any).emailIntegration.update({
    where: {
      userId_platform: {
        userId,
        platform: 'outlook',
      },
    },
    data: {
      accessToken: tokens.access_token,
      expiresAt,
    },
  });

  return tokens.access_token;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || 'gmail';

    // Get integration from database
    const integration = await (db as any).emailIntegration.findUnique({
      where: {
        userId_platform: {
          userId: user.id,
          platform,
        },
      },
    });

    if (!integration || !integration.connected) {
      return NextResponse.json({ error: "Not connected" }, { status: 400 });
    }

    let accessToken = integration.accessToken;

    // Check if token needs refresh
    if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
      if (integration.refreshToken) {
        if (platform === 'gmail') {
          accessToken = await refreshGmailToken(user.id, integration.refreshToken);
        } else {
          accessToken = await refreshOutlookToken(user.id, integration.refreshToken);
        }
      }
      else {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
    }

    // Fetch emails based on platform
    if (platform === 'gmail') {
      // Gmail API
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Gmail messages');
      }

      const data = await response.json();
      const messages = data.messages || [];

      // Fetch full message details
      const emails = await Promise.all(
        messages.slice(0, 20).map(async (msg: any) => {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const msgData = await msgResponse.json();

          const headers = msgData.payload.headers;
          const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || '';

          const snippet = msgData.snippet || '';
          const date = new Date(parseInt(msgData.internalDate));

          return {
            id: msg.id,
            from: getHeader('From'),
            subject: getHeader('Subject'),
            preview: snippet.substring(0, 100),
            date: formatDate(date),
            read: !msgData.labelIds?.includes('UNREAD'),
            starred: msgData.labelIds?.includes('STARRED'),
            important: msgData.labelIds?.includes('IMPORTANT'),
          };
        })
      );

      return NextResponse.json({ emails });
    } else {
      // Outlook/Microsoft Graph API
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=20&$orderby=receivedDateTime desc`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch Outlook messages');
      }

      const data = await response.json();

      const emails = data.value.map((msg: any) => ({
        id: msg.id,
        from: msg.from?.emailAddress?.address || msg.from?.emailAddress?.name || 'Unknown',
        subject: msg.subject || '(No Subject)',
        preview: msg.bodyPreview || '',
        date: formatDate(new Date(msg.receivedDateTime)),
        read: msg.isRead,
        starred: msg.flag?.flagStatus === 'flagged',
        important: msg.importance === 'high',
      }));

      return NextResponse.json({ emails });
    }
  } catch (error: any) {
    console.error('Fetch emails error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

