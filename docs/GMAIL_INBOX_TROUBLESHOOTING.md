# Gmail Inbox Troubleshooting Guide

## Acceptance Criteria Checklist

| Criterion | Status | Notes |
|-----------|--------|------|
| Start Gmail connection | ✅ | `/api/inbox/oauth/gmail` returns auth URL; uses request origin for redirect_uri |
| Account selection works | ✅ | `prompt=select_account consent` forces account picker |
| OAuth callback completes | ✅ | Callback exchanges code, stores tokens, redirects to /inbox?connected=gmail |
| Permissions handling | ✅ | Scopes: gmail.readonly, gmail.modify, userinfo.email, userinfo.profile |
| Connection status shown | ✅ | `/api/inbox/status` returns `{ gmail: { email, connected } }` (no tokens exposed) |
| Tokens stored securely | ✅ | In DB; status endpoint does not expose tokens |
| No conflicting connections | ✅ | One Gmail per user (userId_platform unique); reconnecting updates existing |
| Error logging + user feedback | ✅ | Console logs with [Gmail *] prefix; toast + URL params for user |
| Works on Vercel and local | ✅ | Base URL derived from x-forwarded-* or request origin |

## Changes Made

### OAuth Start (`/api/inbox/oauth/gmail`)
- Derives redirect URI from request (x-forwarded-proto/host, origin, or env) so it works on Vercel without hardcoding
- Added `prompt=select_account consent` for account selection
- Improved error logging

### OAuth Callback (`/api/inbox/oauth/gmail/callback`)
- Uses request URL to build redirect target (Vercel-safe)
- User-friendly error messages: `access_denied`, `token_exchange_failed`, `missing_params`
- Validates state before use
- Handles missing refresh_token (keeps existing if Google doesn’t return one)

### Status (`/api/inbox/status`)
- Returns only `{ email, connected }`; no tokens

### Disconnect (`/api/inbox/disconnect`)
- Clears tokens, sets `connected: false`
- Improved logging

### Inbox Page
- Better error handling when starting OAuth
- Validates `authUrl` before redirect

## What to Verify

### Google Cloud Console
1. **Redirect URIs** (Credentials → OAuth client → Authorized redirect URIs):
   - `http://localhost:3000/api/inbox/oauth/gmail/callback`
   - `https://bloomer-mgyr.vercel.app/api/inbox/oauth/gmail/callback`
   - Your custom domain if used

2. **Test Users** (OAuth consent screen):
   - Add your Gmail under Test users so you can connect while app is in testing mode

### Vercel
1. **Environment variables** (Production):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL` (optional; e.g. `https://bloomer-mgyr.vercel.app`)

2. **Database**:
   - MongoDB/Prisma connected; `EmailIntegration` model migrated

### Common Issues
- **Token exchange failed**: Redirect URI mismatch. Must be identical in Google Console and in code (no trailing slash).
- **access_denied**: User declined, or not in Test users. Add your email as a test user.
- **Works locally, not on Vercel**: Confirm env vars and redirect URI for the Vercel URL.
