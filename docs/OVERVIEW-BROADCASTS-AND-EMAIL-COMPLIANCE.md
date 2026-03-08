# Overview: Broadcasts & Email Compliance

Summary of the broadcast page improvements and email compliance work implemented in this project.

---

## 1. Broadcast page – campaign delete

**Goal:** Let users delete a campaign from the list with a confirmation step.

**What was done:**

- **Three-dots menu:** Each campaign row has a vertical-ellipsis (⋮) button that opens a dropdown.
- **Delete option:** The dropdown includes a “Delete” item (with trash icon). Clicking it does not delete immediately.
- **Confirmation dialog:** A modal appears: *“Are you sure you wish to delete this campaign? This action cannot be undone.”*
  - **No** – closes the dialog and cancels.
  - **Yes** (red/destructive button) – calls `DELETE /api/campaigns/{id}`, then closes the dialog and refreshes the campaign list.
- **Data integrity:** Deleting a campaign relies on Prisma’s `onDelete: Cascade` for `CampaignRecipient`, so recipients are removed with the campaign and no orphan data is left.

**Files touched:** `components/broadcasts/CampaignsTable.tsx`, `components/broadcasts/BroadcastsClient.tsx`

---

## 2. Email compliance – data layer & merge tags

**Goal:** Use shop name/address and per-recipient URLs in emails and support merge tags.

**What was done:**

- **Shop data:** The existing `Shop.address` field is used as the physical address string (e.g. *"123 Main St, Portland OR 97201, USA"*). No new DB field was added.
- **Mailer context:** When sending campaign emails we now pass:
  - `shop.name` → **{{shopName}}**
  - `shop.address` → **{{shopAddress}}**
  - **{{unsubscribeUrl}}** – per-recipient (signed JWT link)
  - **{{privacyUrl}}** – app base URL + `/privacy`
- **Merge tags:** Body and footer support the above plus **{{firstName}}**, **{{lastName}}**, **{{email}}**. All are replaced server-side before calling Resend (no Handlebars; simple `replace()`).

**Files touched:** `lib/resend-email.ts`, `lib/email-footer.ts`, `app/api/campaigns/route.ts`, `app/api/campaigns/send-schedule/route.ts`, `app/api/campaigns/[id]/route.ts`

---

## 3. Email compliance – footer (structure & styling)

**Goal:** CAN-SPAM–style footer: table layout, MSO-safe, clear structure and typography.

**What was done:**

- **Shared footer:** `lib/email-footer.ts` exports a footer template and a function to replace its merge tags.
- **Structure:**
  - Wrapped in `<table role="presentation">` (no `<div>`) for better email-client support.
  - Outer cell uses `border-top: 1px solid #e5e5e5` to separate from the body.
  - Three rows:
    1. Permission: *“You received this because you're a customer of {{shopName}}.”*
    2. Address: *“{{shopName}} • {{shopAddress}}”* (• = `&bull;`)
    3. Links: *“Unsubscribe”* (→ {{unsubscribeUrl}}) · *“Privacy Policy”* (→ {{privacyUrl}}) (· = `&middot;`)
- **Styling:** Footer text: `font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #999999; text-align: center`. Links use `color: #999999` inline.
- **MSO:** Inner table is wrapped in MSO conditional comments so Outlook doesn’t break the layout.
- **Resend:** Before each send we build `fullHtml = personalizedBody + footerHtml` and pass that to `resend.emails.send()`.

**Files touched:** `lib/email-footer.ts`, `lib/resend-email.ts`

---

## 4. Unsubscribe flow (JWT, DB, one-click, opt-back-in)

**Goal:** Signed unsubscribe links, DB flag, one-click support, and a way to opt back in.

**What was done:**

- **DB:** Added **`unsubscribedAt: DateTime?`** on the `Customer` model. Unsubscribed customers are kept in the DB but excluded from future campaign sends.
- **JWT:** `lib/unsubscribe-token.ts`:
  - **`signUnsubscribeToken(customerId)`** – builds a JWT with `{ customerId }`, signed with **`UNSUBSCRIBE_SECRET`**, 30-day expiry.
  - **`verifyUnsubscribeToken(token)`** – verifies and returns `{ customerId }` or `null`.
- **Env:** `.env.example` documents **`UNSUBSCRIBE_SECRET`** (long random string, e.g. `openssl rand -base64 32`). Same value must be set in `.env`.

**Unsubscribe (opt-out):**

- **GET `/unsubscribe?token=...`** (page): Verifies JWT, sets `unsubscribedAt = new Date()`, shows “You’re unsubscribed” and an “Opt back in” link. Same token is used for the opt-back-in link.
- **POST `/api/unsubscribe?token=...`** (API): Used for one-click unsubscribe (RFC 8058). Verifies JWT, sets `unsubscribedAt = new Date()`, returns 200. The **List-Unsubscribe** header points to this URL so mail clients can POST here.

**Opt-back-in (re-subscribe):**

- **GET `/subscribe?token=...`** (page): Verifies the same JWT, sets `unsubscribedAt = null`, shows “You’re back on the list.”

**Mailer:**

- Footer link in the email body → **`/unsubscribe?token=...`** (confirmation page).
- **List-Unsubscribe** and **List-Unsubscribe-Post** headers → **`/api/unsubscribe?token=...`** so one-click works.
- Before sending to a recipient we skip if `customer.unsubscribedAt` is set (and we filter unsubscribed customers when building the recipient list).

**Routing:** Middleware allows unauthenticated access to `/unsubscribe` and `/subscribe`.

**Files touched:** `prisma/schema.prisma`, `lib/unsubscribe-token.ts`, `app/unsubscribe/page.tsx`, `app/subscribe/page.tsx`, `app/api/unsubscribe/route.ts`, `lib/resend-email.ts`, `middleware.ts`, `.env.example`

---

## 5. Excluding unsubscribed customers from campaigns

**Goal:** Never target unsubscribed customers when creating or sending campaigns.

**What was done:**

- **New campaigns (POST /api/campaigns):** When resolving “All Customers” or an audience, we fetch customers and then **filter in application code** with `unsubscribedAt == null` (so both “field missing” and “field is null” count as subscribed). We do not rely only on Prisma `where: { unsubscribedAt: null }` because in MongoDB that can exclude documents where the field is missing (e.g. older customers).
- **Scheduled / PATCH send:** When building the list from `campaign.recipients`, we filter out recipients whose `customer.unsubscribedAt` is set and pass the filtered list (with `unsubscribedAt` included) into `sendCampaignEmails`, which also skips sending to anyone with `unsubscribedAt` set.

**Files touched:** `app/api/campaigns/route.ts`, `app/api/campaigns/send-schedule/route.ts`, `app/api/campaigns/[id]/route.ts`, `lib/resend-email.ts`

---

## 6. Fixes and polish

- **Build conflict:** Next.js does not allow both `page.tsx` and `route.ts` in the same segment. We removed `app/unsubscribe/route.ts` and moved the one-click **POST** handler to **`app/api/unsubscribe/route.ts`**. The mailer uses the API URL for the **List-Unsubscribe** header and keeps the page URL for the footer link.
- **Campaign 400 with “All Customers”:** Avoided filtering by `unsubscribedAt` in the Prisma `where` for MongoDB; we fetch then filter in JS so existing customers (no `unsubscribedAt` field) are included.
- **Unsubscribe page layout:** “Opt back in” and “Return to home” are in a small flex column with gap so they don’t run together as one line.

---

## 7. Cross-client testing checklist (manual)

Before treating email as fully compliant, validate in:

- **Gmail** (web + mobile) – link colors and footer layout.
- **Outlook Desktop** (2016/2019/365) – MSO conditionals and layout.
- **Outlook Mobile** – centering and font size.
- **Apple Mail** (macOS + iOS) – dark mode and contrast of #999 text.

---

## 8. Quick reference – env and URLs

| Env variable        | Purpose |
|---------------------|--------|
| `UNSUBSCRIBE_SECRET` | Long random string used to sign/verify unsubscribe JWTs. |

| URL / endpoint              | Purpose |
|-----------------------------|--------|
| `GET /unsubscribe?token=...`  | Unsubscribe confirmation page; marks customer unsubscribed. |
| `POST /api/unsubscribe?token=...` | One-click unsubscribe (List-Unsubscribe-Post). |
| `GET /subscribe?token=...`    | Opt-back-in page; clears `unsubscribedAt`. |
| `GET /privacy`               | Privacy policy (linked in footer). |

---

## 9. File list (summary)

- **Components:** `CampaignsTable.tsx`, `BroadcastsClient.tsx`
- **Lib:** `resend-email.ts`, `email-footer.ts`, `unsubscribe-token.ts`
- **App routes:** `app/unsubscribe/page.tsx`, `app/subscribe/page.tsx`, `app/api/unsubscribe/route.ts`
- **API campaigns:** `app/api/campaigns/route.ts`, `app/api/campaigns/send-schedule/route.ts`, `app/api/campaigns/[id]/route.ts`
- **Config / schema:** `prisma/schema.prisma`, `middleware.ts`, `.env.example`
- **Tests:** `lib/resend-email.test.ts` (merge tags and `MERGE_TAGS`)

This document is the single overview of what was implemented for broadcasts and email compliance.
