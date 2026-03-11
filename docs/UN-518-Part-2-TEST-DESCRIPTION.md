# UN-518 Part 2: Test Description

**Branch:** `UN-518-Part-2-TestUsers&GoogleAPITokensAdded`  
**Feature:** Gmail CRM Inbox integration - test users and Google API token handling

---

## Overview

This branch implements and fixes Gmail OAuth for the CRM Inbox, enabling users to connect their Gmail account to send, receive, and manage emails within Bloomer. The changes include account selection, secure token storage, improved error handling, and reliable redirect URI handling for local and production deployments.

---

## Test Prerequisites

- [ ] Google Cloud Console project with Gmail API enabled
- [ ] OAuth 2.0 credentials (Client ID and Client Secret) created
- [ ] Test users added to OAuth consent screen (Audience → Test users)
- [ ] Redirect URIs added in Google Console:
  - Local: `http://localhost:3000/api/inbox/oauth/gmail/callback`
  - Production: `https://<your-domain>/api/inbox/oauth/gmail/callback`
- [ ] Environment variables set: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] Database: `npx prisma generate` and `npx prisma db push` run
- [ ] Bloomer user account created and signed in

---

## Test Cases

### TC1: Start Gmail Connection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Sign in to Bloomer | User is authenticated |
| 2 | Navigate to Inbox page | Inbox loads; "Connect Your Email" card is visible |
| 3 | Click Gmail option ("Connect your Gmail account securely") | Browser redirects to Google OAuth consent screen |
| 4 | Verify terminal/logs | `[Gmail OAuth] Using redirect_uri: ...` is logged with correct URL |

---

### TC2: Account Selection

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Google consent screen, verify account picker | User can select which Gmail account to connect |
| 2 | Select a Gmail account that is added as a test user | Permissions screen appears |
| 3 | Select an account that is NOT a test user | Access denied or appropriate restriction message |

---

### TC3: OAuth Callback and Token Exchange

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Google permissions screen, grant requested access | User is redirected back to Bloomer Inbox |
| 2 | Verify redirect URL | Lands on `/inbox?connected=gmail` |
| 3 | Verify success feedback | Toast: "Gmail connected successfully!" |
| 4 | Verify connection status | Badge shows "Gmail Connected" with connected email address |

---

### TC4: Connection Status Display

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With Gmail connected, view Inbox page | "Gmail Connected - [email]" badge is visible |
| 2 | Open "Email Platform" card | Shows connected account email |
| 3 | Refresh page | Connection status persists (tokens stored) |

---

### TC5: Permissions and Error Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | On Google consent screen, click "Back to safety" or cancel | Redirected to Inbox with error toast (e.g. "You declined access...") |
| 2 | Remove redirect URI from Google Console, attempt connection | After granting access, see "Redirect URI mismatch" or similar error with exact URL to add |
| 3 | Check terminal on failure | `[Gmail Callback] Token exchange failed: ... redirect_uri used: ...` logged |

---

### TC6: Disconnect

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | With Gmail connected, click "Disconnect Gmail" | Confirmation; connection is cleared |
| 2 | Verify UI | "Connect Your Email" card shows again |
| 3 | Reconnect Gmail | Same flow as TC1–TC3; no conflicting connection |

---

### TC7: Local vs Production (Vercel)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Run locally (`npm run dev`), connect Gmail | Uses `http://localhost:3000/...` redirect URI |
| 2 | Deploy to Vercel with correct env vars | Uses `https://<vercel-url>/...` redirect URI |
| 3 | Connect Gmail on production | Same success flow; tokens stored; emails load |

---

## Regression Checks

- [ ] Inbox page loads without 500 (EmailIntegration model available)
- [ ] Other dashboard pages (Dashboard, Settings, etc.) work as before
- [ ] Sign-in and sign-up flows unaffected
- [ ] Build completes: `npm run build` succeeds

---

## Known Limitations

- Test users only: While app is in Google OAuth "Testing" mode, only added test users can connect.
- Token expiration: Test user authorizations may expire after 7 days; reconnect if needed.
