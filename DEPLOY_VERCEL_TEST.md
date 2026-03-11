# Deploy to Vercel to Test Inbox & Inventory (No Localhost)

Use this guide to deploy Bloomer to Vercel so you can test UN-619, UN-620, UN-634 (Inbox & Inventory) without running locally.

---

## Step 1: Push to GitHub

If not already done:

```bash
cd bloomer
git add .
git commit -m "UN-619,620,634: Inbox & Inventory updates"
git push origin UN-619,620,634-Inbox&InventoryUpdates
```

(Use your actual branch name if different.)

---

## Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub).
2. **New Project** → Import your Bloomer repo.
3. **Root Directory**: Set to `bloomer` if the repo root is `bloomer test`.
4. **Framework Preset**: Next.js (auto-detected).
5. Click **Deploy** (you can add env vars after the first deploy).

---

## Step 3: Set Environment Variables

In Vercel: **Project → Settings → Environment Variables**. Add:

| Variable | Value | Notes |
|----------|-------|-------|
| `AUTH_SECRET` | (same as your .env) | Required for auth |
| `NEXTAUTH_SECRET` | (same as your .env) | Same as AUTH_SECRET |
| `DATABASE_URL` | Your MongoDB connection string | Same as .env |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID | For Gmail Inbox |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret | For Gmail Inbox |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` | **Use your actual Vercel URL** |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT.vercel.app` | Same as above |

**Important:** Replace `YOUR-PROJECT` with your real Vercel project URL (e.g. `bloomer-mgyr` → `https://bloomer-mgyr.vercel.app`).

After adding variables, trigger a **Redeploy** (Deployments → ⋮ → Redeploy).

---

## Step 4: Add Gmail Redirect URI in Google Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Edit your OAuth 2.0 Client ID.
3. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-PROJECT.vercel.app/api/inbox/oauth/gmail/callback
   ```
   (Use your real Vercel URL, no trailing slash.)
4. Save.

---

## Step 5: Test

1. Open `https://YOUR-PROJECT.vercel.app`.
2. **Sign up / Sign in** (Credentials auth).
3. **Create a shop** if needed (Settings or `/shop/create`).
4. **Inbox** (`/inbox`): Connect Gmail, list emails, favorite, archive, delete.
5. **Storefront** (`/storefront`): Add products, adjust inventory, use low-stock filter.
6. **Dashboard** (`/dashboard`): Check inventory status badges.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 401 Unauthorized | Ensure `AUTH_SECRET` and `NEXTAUTH_URL` are set. Redeploy after changing env vars. |
| Gmail "Redirect URI mismatch" | Add the exact callback URL from Vercel logs to Google Console. Check for typos and trailing slashes. |
| "Gmail OAuth not configured" | Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel. |
| Build fails | Check Vercel build logs. Ensure `bloomer` is the root if the repo has a parent folder. |

---

## Quick Reference: Your Vercel URL

After deploy, your app URL will look like:
- `https://bloomer-xxxxx.vercel.app` (default)
- Or a custom domain if you add one

Use this URL everywhere you need `NEXTAUTH_URL` and for the Gmail redirect URI.
