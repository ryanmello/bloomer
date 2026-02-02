import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import db from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/inbox?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/inbox?error=missing_params`);
    }

    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/inbox/oauth/gmail/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/inbox?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    // Calculate expiration
    const expiresAt = expires_in ? new Date(Date.now() + expires_in * 1000) : null;

    // Store tokens in database
    const existing = await (db as any).emailIntegration.findUnique({
      where: {
        userId_platform: {
          userId,
          platform: 'gmail',
        },
      },
    });

    if (existing) {
      await (db as any).emailIntegration.update({
        where: { id: existing.id },
        data: {
          email,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          connected: true,
        },
      });
    } else {
      await (db as any).emailIntegration.create({
        data: {
          userId,
          platform: 'gmail',
          email,
          accessToken: access_token,
          refreshToken: refresh_token,
          expiresAt,
          connected: true,
        },
      });
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/inbox?connected=gmail`);
  } catch (error: any) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/inbox?error=${encodeURIComponent(error.message)}`);
  }
}


