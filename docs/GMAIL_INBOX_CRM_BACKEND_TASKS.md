# Gmail Inbox + CRM Integration: Backend Tasks & Resources

This document outlines backend work tasks and learning resources for integrating Gmail with the Bloomer CRM, making the inbox fully interactive and enabling the CRM to interact with the inbox through the website.

---

## Current State

Bloomer already has:

- **Inbox UI** at `/inbox` with Gmail OAuth
- **Basic email fetch** via Gmail API (`GET /api/inbox/emails`)
- **Connection status** and disconnect flows
- **Token refresh** for Gmail and Outlook

**Not yet implemented:**

- Reply/send from CRM
- Mark as read/unread
- Link emails to Customers
- Create Customer/Order from email
- Search, labels, archive, trash
- Full email body display and threading
- CRM ↔ Inbox bidirectional interaction

---

## Epic: Gmail Inbox + CRM Integration

**Epic key:** `BLMR-INBOX-CRM`  
**Summary:** Make Gmail inbox interactive within the CRM and enable the CRM to act on inbox data (link to customers, create orders, send emails).

---

## Learning Resources

### Gmail API – Official Docs

| Resource | URL | Purpose |
|----------|-----|---------|
| Gmail API Overview | https://developers.google.com/gmail/api | High-level overview, concepts |
| Gmail API Reference | https://developers.google.com/gmail/api/reference/rest | Full REST API reference |
| Users.messages | https://developers.google.com/gmail/api/reference/rest/v1/users.messages | List, get, modify, send messages |
| Users.messages.send | https://developers.google.com/gmail/api/reference/rest/v1/users.messages/send | Send email |
| Users.messages.modify | https://developers.google.com/gmail/api/reference/rest/v1/users.messages/modify | Mark read, add/remove labels |
| Users.threads | https://developers.google.com/gmail/api/reference/rest/v1/users.threads | Thread view support |
| OAuth 2.0 Scopes | https://developers.google.com/gmail/api/auth/scopes | Required scopes for read/write |

### Gmail API – Tutorials & Guides

| Resource | URL | Purpose |
|----------|-----|---------|
| Gmail API Quickstart (Node.js) | https://developers.google.com/gmail/api/quickstart/nodejs | Get started with Node/JS |
| Sending email via Gmail API | https://developers.google.com/gmail/api/guides/sending | Base64 encoding, MIME structure |
| Reading email (messages.get) | https://developers.google.com/gmail/api/guides/messages | Parse headers, body, attachments |
| Gmail API + Next.js examples | Search: "gmail api next.js" | Integration patterns |

### Node.js / TypeScript

| Resource | Purpose |
|----------|---------|
| `googleapis` npm package | https://www.npmjs.com/package/googleapis | Official Google API client for Node |
| Gmail API with googleapis | https://github.com/googleapis/google-api-nodejs-client#gmail | Typed client usage |

### Architecture & Patterns

| Topic | Where to learn |
|-------|----------------|
| OAuth token storage & refresh | `bloomer/app/api/inbox/emails/route.ts` (existing) |
| Linking external IDs to CRM entities | Customer `email` field; design `EmailActivity` model |

---

## Backend Work Tasks

### Phase 1: Inbox Read/Modify (Gmail Operations)

#### BLMR-INBOX-101 — Mark email as read/unread

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | API to mark Gmail messages as read or unread |
| **Description** | Use Gmail API `users.messages.modify` to add/remove `UNREAD` label. Called when user opens an email in the CRM inbox. |
| **Acceptance criteria** | • `PATCH /api/inbox/emails/[id]` accepts `{ read: true \| false }`.<br>• Uses Gmail API `modify` with `addLabelIds` / `removeLabelIds`.<br>• Auth: only for connected user's integration.<br>• Returns 200 on success. |
| **Resources** | Gmail API users.messages.modify |
| **Labels** | backend, inbox, gmail |

---

#### BLMR-INBOX-102 — Fetch full email body and thread

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | API to fetch full email content (body, attachments metadata) and optional thread |
| **Description** | Current implementation returns snippet only. Add endpoint to fetch full message for display; optionally include thread messages. |
| **Acceptance criteria** | • `GET /api/inbox/emails/[id]` returns full message: `{ id, from, to, subject, bodyHtml, bodyPlain, date, labels, threadId }`.<br>• Optional `?includeThread=true` fetches all messages in thread.<br>• Sanitize `bodyHtml` for safe display (or return plain + markdown). |
| **Resources** | Gmail API messages.get, MIME parsing |
| **Labels** | backend, inbox, gmail |

---

#### BLMR-INBOX-103 — Archive, trash, star (labels)

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | API to archive, trash, and star/unstar emails |
| **Description** | Use Gmail API `modify` to apply labels: INBOX (restore), TRASH, STARRED, etc. |
| **Acceptance criteria** | • `POST /api/inbox/emails/[id]/archive` removes INBOX label.<br>• `POST /api/inbox/emails/[id]/trash` adds TRASH, removes INBOX.<br>• `PATCH /api/inbox/emails/[id]` accepts `{ starred: true \| false }`.<br>• All operations scoped to authenticated user. |
| **Resources** | Gmail API modify, Gmail labels |
| **Labels** | backend, inbox, gmail |

---

#### BLMR-INBOX-104 — Gmail search and filters

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Support Gmail search query in emails endpoint |
| **Description** | Gmail API supports `q` parameter (e.g. `from:john`, `subject:order`, `is:unread`). Pass through to list endpoint. |
| **Acceptance criteria** | • `GET /api/inbox/emails?platform=gmail&q=...` forwards `q` to Gmail API.<br>• Sanitize/validate query to prevent injection.<br>• Document supported Gmail search operators. |
| **Resources** | Gmail API messages.list, search operators |
| **Labels** | backend, inbox, gmail |

---

### Phase 2: Send & Reply from CRM

#### BLMR-INBOX-201 — Send email via Gmail API

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | API to send email from connected Gmail account |
| **Description** | Use Gmail API `users.messages.send`. Build MIME message from `to`, `subject`, `body` (plain and/or HTML). |
| **Acceptance criteria** | • `POST /api/inbox/send` accepts `{ to, subject, bodyPlain, bodyHtml?, replyToMessageId? }`.<br>• Uses RFC 2822 / MIME format; base64url encode.<br>• If `replyToMessageId` provided, set `In-Reply-To` and `References` headers for threading.<br>• Requires `gmail.send` or `gmail.compose` scope (add to OAuth). |
| **Resources** | Gmail API send, MIME format, nodemailer MIME building |
| **Labels** | backend, inbox, gmail, send |

---

#### BLMR-INBOX-202 — Reply to email (threading)

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Reply to existing email with proper threading |
| **Description** | Extend send endpoint to fetch original message headers and set `In-Reply-To` and `References` for proper threading in Gmail. |
| **Acceptance criteria** | • `POST /api/inbox/send` with `replyToMessageId` correctly threads in Gmail.<br>• Optional: include quoted original in body. |
| **Labels** | backend, inbox, gmail |

---

### Phase 3: CRM ↔ Inbox Integration

#### BLMR-INBOX-301 — Link email to Customer (schema + API)

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Data model and API to link inbox emails to CRM Customers |
| **Description** | Add `EmailActivity` (or similar) model: `emailId`, `customerId`, `shopId`, `direction` (inbound/outbound), `subject`, `snippet`, `sentAt`, `gmailMessageId`. Parse sender `From` to match Customer by `email`. |
| **Acceptance criteria** | • Prisma: `EmailActivity` model with `customerId`, `shopId`, `gmailMessageId`, `direction`, `subject`, `snippet`, `sentAt`.<br>• `POST /api/inbox/emails/[id]/link-customer` with `customerId` creates link.<br>• `GET /api/customers/[id]/emails` returns linked emails for customer.<br>• Auto-suggest Customer when opening email if `From` matches existing Customer email. |
| **Labels** | backend, inbox, crm, database |

---

#### BLMR-INBOX-302 — Create Customer from email sender

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Quick-add Customer from unknown email sender |
| **Description** | When viewing an email from an address not in CRM, allow "Create Customer" from inbox. Pre-fill `email`, optionally parse name from `From` header. |
| **Acceptance criteria** | • `POST /api/inbox/emails/[id]/create-customer` accepts `{ email, firstName?, lastName?, shopId }`.<br>• Creates Customer, then links email via EmailActivity.<br>• Returns new `customerId` and linked email record. |
| **Labels** | backend, inbox, crm, customers |

---

#### BLMR-INBOX-303 — Create Order/Task from email

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Create Order or Task from email (e.g. order request in email body) |
| **Description** | Allow "Create Order" or "Create Task" from inbox when email is linked to a Customer. Pre-fill notes from email body/snippet. |
| **Acceptance criteria** | • `POST /api/inbox/emails/[id]/create-order` with `customerId` creates Order with note referencing email.<br>• Optional: `POST /api/inbox/emails/[id]/create-task` if Task model exists.<br>• Email remains linked via EmailActivity. |
| **Labels** | backend, inbox, crm, orders |

---

#### BLMR-INBOX-304 — Customer profile: email timeline

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Show linked email history on Customer profile page |
| **Description** | Add "Emails" or "Activity" section to Customer detail view. Fetch linked emails via `GET /api/customers/[id]/emails` and display chronologically. |
| **Acceptance criteria** | • Customer detail page includes email timeline.<br>• Clicking email opens it in inbox or inline.<br>• Can reply from timeline (calls send API). |
| **Labels** | backend, frontend, crm, inbox |

---

### Phase 4: Reliability & UX

#### BLMR-INBOX-401 — Webhook or polling for new emails

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Support real-time or periodic refresh of inbox |
| **Description** | Gmail supports push notifications via Pub/Sub; setup can be complex. Simpler approach: polling every N seconds when inbox is open, or manual refresh. |
| **Acceptance criteria** | • Option A: `GET /api/inbox/emails` supports `?since=timestamp` for incremental fetch.<br>• Option B: Frontend polls every 60s when tab focused; show unread count badge.<br>• Document future Pub/Sub path if needed. |
| **Labels** | backend, inbox, realtime |

---

#### BLMR-INBOX-402 — Token encryption at rest

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Encrypt Gmail tokens in database (production) |
| **Description** | INBOX_SETUP.md notes tokens are stored in plain text. Encrypt `accessToken` and `refreshToken` in EmailIntegration before storing; decrypt when reading. |
| **Acceptance criteria** | • Tokens encrypted with app secret before DB write.<br>• Decrypted only in memory when making Gmail API calls.<br>• No plain-text tokens in logs. |
| **Labels** | backend, security, inbox |

---

## How to Apply Gmail Inbox Into the CRM

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Bloomer CRM (Next.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  /inbox (UI)                                                      │
│     ├── List emails (Gmail API)                                   │
│     ├── Open email → mark read, show full body                    │
│     ├── Reply/Send → Gmail API send                               │
│     └── Actions: Link to Customer | Create Customer | Create Order│
├─────────────────────────────────────────────────────────────────┤
│  API Routes                                                       │
│     /api/inbox/emails       → list, get by id                     │
│     /api/inbox/emails/[id]  → PATCH (read, starred), full body    │
│     /api/inbox/send         → POST send/reply                     │
│     /api/inbox/emails/[id]/link-customer                          │
│     /api/inbox/emails/[id]/create-customer                        │
│     /api/inbox/emails/[id]/create-order                            │
│     /api/customers/[id]/emails → linked email timeline             │
├─────────────────────────────────────────────────────────────────┤
│  Database (Prisma)                                                 │
│     EmailIntegration (existing)                                    │
│     EmailActivity (new) → links Gmail messages to Customers       │
├─────────────────────────────────────────────────────────────────┤
│  External                                                          │
│     Gmail API (users.messages, users.threads)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Order

1. **Phase 1** – BLMR-INBOX-101 through 104: Make inbox fully readable and modifiable (read, archive, trash, search).
2. **Phase 2** – BLMR-INBOX-201, 202: Send and reply from CRM.
3. **Phase 3** – BLMR-INBOX-301 through 304: Link emails to Customers, create Customers/Orders from emails, show timeline on Customer profile.
4. **Phase 4** – BLMR-INBOX-401, 402: Polling/refresh and token encryption.

### Key Gmail API Endpoints to Use

| Operation | Gmail API | Method |
|-----------|-----------|--------|
| List messages | `GET /gmail/v1/users/me/messages?q=...` | Existing |
| Get message | `GET /gmail/v1/users/me/messages/{id}?format=full` | Add |
| Modify (read, labels) | `POST /gmail/v1/users/me/messages/{id}/modify` | Add |
| Send | `POST /gmail/v1/users/me/messages/send` | Add |
| Get thread | `GET /gmail/v1/users/me/threads/{id}` | Optional |

### OAuth Scopes to Add (if not already)

```
https://www.googleapis.com/auth/gmail.readonly   # existing
https://www.googleapis.com/auth/gmail.modify     # existing
https://www.googleapis.com/auth/gmail.send       # ADD for send
https://www.googleapis.com/auth/gmail.compose    # alternative to send
```

### Parsing `From` Header for Customer Match

`From` header format: `"Name" <email@example.com>` or `email@example.com`

1. Extract email with regex: `/[^<\s]+@[^>\s]+/` or use `mailparser`-style parsing.
2. Query: `Customer.findFirst({ where: { email: extractedEmail, shopId } })`.
3. If match → auto-link; if not → show "Create Customer" in UI.

---

## Quick Start: First Task to Implement

**BLMR-INBOX-101 (Mark as read)** is a good starting point:

1. Create `app/api/inbox/emails/[id]/route.ts`
2. Implement `PATCH` handler that:
   - Gets `accessToken` from EmailIntegration (like existing emails route)
   - Calls `https://gmail.googleapis.com/gmail/v1/users/me/messages/{id}/modify`
   - Body: `{ addLabelIds: [], removeLabelIds: ["UNREAD"] }` for mark read, or inverse for unread
3. Wire frontend: on `handleEmailClick`, call this API
4. Test with a real Gmail message ID

---

## References

- Existing inbox code: `bloomer/app/api/inbox/`, `bloomer/app/(dashboard)/inbox/`
- Setup guide: `bloomer/INBOX_SETUP.md`
- Prisma schema: `bloomer/prisma/schema.prisma` (Customer, Order, EmailIntegration)
