# Inbox Integration Setup Guide

This guide will help you set up Gmail and Outlook OAuth integration for the inbox feature.

## Prerequisites

1. You need to run the Prisma migration to add the EmailIntegration model:
```bash
npx prisma migrate dev --name add_email_integration
```

2. Or if using MongoDB (which this project uses), you may need to manually create the collection or use Prisma's push:
```bash
npx prisma db push
```

## Gmail OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API" and enable it
4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: "Bloomer"
     - User support email: Your email
     - Developer contact information: Your email
   - Click "Save and Continue"
   - Add scopes (if not already added):
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click "Save and Continue"
   - **IMPORTANT: Add Test Users:**
     - Click "Add Users"
     - Add your email address (and any other test users)
     - Click "Add"
   - Click "Save and Continue"
5. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/inbox/oauth/gmail/callback` (for development)
     - `https://yourdomain.com/api/inbox/oauth/gmail/callback` (for production)
6. Copy the Client ID and Client Secret
7. Add to your `.env` file:
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

**Important Notes:**
- During development, your app will be in "Testing" mode
- Only users added as "Test Users" in the OAuth consent screen can sign in
- To allow anyone to sign in, you'll need to publish your app (requires verification)
- For production, you'll need to submit your app for Google verification

## Outlook OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" > "App registrations"
3. Click "New registration"
4. Fill in the details:
   - Name: Your app name
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: 
     - Platform: Web
     - URI: `http://localhost:3000/api/inbox/oauth/outlook/callback` (for development)
     - Add another for production: `https://yourdomain.com/api/inbox/oauth/outlook/callback`
5. After creation, note the Application (client) ID
6. Go to "Certificates & secrets" > "New client secret"
7. Copy the client secret value (you can only see it once!)
8. Go to "API permissions" and add:
   - Microsoft Graph > Delegated permissions:
     - `Mail.Read`
     - `Mail.ReadWrite`
     - `User.Read`
9. Add to your `.env` file:
```
MICROSOFT_CLIENT_ID=your_client_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
```

## Environment Variables

Add these to your `.env` file:

```env
# Gmail OAuth
GOOGLE_CLIENT_ID=your_gmail_client_id
GOOGLE_CLIENT_SECRET=your_gmail_client_secret

# Outlook OAuth
MICROSOFT_CLIENT_ID=your_outlook_client_id
MICROSOFT_CLIENT_SECRET=your_outlook_client_secret

# Base URL (for OAuth redirects)
NEXTAUTH_URL=http://localhost:3000  # or your production URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Security Notes

⚠️ **Important**: 
- Never commit your OAuth credentials to version control
- Store tokens securely in the database (consider encryption for production)
- The current implementation stores tokens in plain text - consider encrypting them for production use
- Use environment variables for all sensitive data

## Testing

1. Start your development server: `npm run dev`
2. Navigate to `/inbox`
3. Click on either "Gmail" or "Outlook" to connect
4. You'll be redirected to the provider's login page
5. After authorizing, you'll be redirected back and your emails will load

## Vercel Deployment

1. Add environment variables in Vercel Project Settings → Environment Variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_URL` = `https://your-project.vercel.app` (optional; app detects from request if not set)

2. In Google Cloud Console → Credentials → your OAuth client, add this exact redirect URI:
   - `https://your-project.vercel.app/api/inbox/oauth/gmail/callback`
   - Replace `your-project` with your Vercel project URL (e.g. `bloomer-mgyr.vercel.app`)

3. If using a custom domain, add that callback URL too:
   - `https://gobloomer.com/api/inbox/oauth/gmail/callback`

4. Disable "Require verified commits" in Vercel Git settings if deployments are being canceled.

## Troubleshooting

- **"OAuth not configured"**: Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in env
- **"Token exchange failed"**: Redirect URI in Google Console must match exactly (no trailing slash). Add both `http://localhost:3000/api/inbox/oauth/gmail/callback` and your Vercel URL.
- **"access_denied"**: User declined, or app not verified. For testing, add Test Users in OAuth consent screen.
- **"Failed to fetch emails"**: Verify Gmail API is enabled; check token refresh logic
- **Works locally but not on Vercel**: Verify env vars are set for Production; check Vercel function logs

