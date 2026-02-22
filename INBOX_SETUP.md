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

## Local setup checklist

1. **Copy credentials** from Vercel (or Google Cloud) into `bloomer/.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
2. **Google Cloud** → Credentials → your OAuth client → ensure `http://localhost:3000/api/inbox/oauth/gmail/callback` is in **Authorized redirect URIs**
3. **NEXTAUTH_URL** in `.env` must be `http://localhost:3000` for local dev

## Testing

1. Start your development server: `npm run dev`
2. Sign in to Bloomer (if not already)
3. Navigate to `/inbox`
4. Click **Gmail** to connect
5. You'll be redirected to Google's login page
6. After authorizing, you'll be redirected back and your emails will load

## Troubleshooting

- **"OAuth not configured"**: Make sure environment variables are set correctly
- **"Token exchange failed"**: Check that redirect URIs match exactly in OAuth provider settings
- **"Failed to fetch emails"**: Verify API permissions are granted in OAuth provider
- **Database errors**: Make sure Prisma schema is synced with your database

