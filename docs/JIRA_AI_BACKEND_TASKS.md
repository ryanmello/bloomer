# Jira Tasks: Backend for AI Aspects (First Layer)

Backend-focused tickets for the AI features advertised on the landing page (Lilli AI Agent, voice agent, automated support, smart order routing, AI-powered campaigns). These are first-layer backend tasks: APIs, data models, auth, and integration points. Lilli repository can be referenced for agent behavior; this doc assumes integration via API/webhook.

---

## Epic: AI Backend Foundation

**Epic key:** `BLMR-AI-EPIC`  
**Summary:** Backend infrastructure and APIs to support Lilli AI Agent, voice agent, automated support, smart routing, and AI-powered campaigns.

---

## 1. Lilli AI Agent Assistant

### BLMR-AI-101 — Lilli agent API route and auth

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Add backend API route for Lilli AI Agent (chat/assistant) with auth and rate limiting |
| **Description** | Expose a first-layer API that the Lilli agent (or Lilli repo service) can call, or that the frontend can use to proxy to Lilli. Authenticate with existing NextAuth session or API key; apply rate limits per shop/user. |
| **Acceptance criteria** | • `POST /api/ai/agent` (or `/api/lilli/chat`) exists and returns 401 when unauthenticated.<br>• Request body accepts `message`, `conversationId`, optional `shopId`.<br>• Response shape is defined (e.g. `{ reply, conversationId }`).<br>• Rate limit applied (e.g. per user/shop).<br>• Integration point documented for Lilli repo (env vars, webhook URL, or server-to-server auth). |
| **Labels** | backend, ai, lilli, first-layer |

---

### BLMR-AI-102 — Lilli agent data model and persistence

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Persist Lilli agent conversations and context per shop/user |
| **Description** | Add Prisma models (or equivalent) to store agent conversations and optional metadata so Lilli can use history for context. First layer: schema + CRUD API only; no LLM logic in Bloomer yet. |
| **Acceptance criteria** | • Prisma schema includes `AgentConversation` (e.g. `id`, `shopId`, `userId`, `customerId?`, `createdAt`, `updatedAt`) and `AgentMessage` (e.g. `id`, `conversationId`, `role`, `content`, `createdAt`).<br>• `GET /api/ai/conversations` and `GET /api/ai/conversations/[id]` return only data for the authenticated user’s shop.<br>• Optional: `POST /api/ai/conversations` to create conversation; link to Customer when applicable. |
| **Labels** | backend, ai, lilli, database |

---

### BLMR-AI-103 — Lilli agent configuration per shop

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Store Lilli agent configuration per shop (enabled/disabled, optional settings) |
| **Description** | Backend support for “enable Lilli for this shop” and optional settings (e.g. greeting, business hours). No UI required in this task; API and schema only. |
| **Acceptance criteria** | • Prisma: `Shop` has optional `lilliEnabled Boolean`, and either inline fields or a JSON `lilliConfig` for future options.<br>• `GET/PATCH /api/shop` or `GET/PATCH /api/ai/agent/config` expose and update Lilli config for the current user’s shop.<br>• Lilli agent API uses this config to decide if agent is enabled for the shop. |
| **Labels** | backend, ai, lilli, config |

---

## 2. Voice Agent for Phone Orders

### BLMR-AI-201 — Voice webhook endpoint for Lilli/voice provider

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Backend webhook endpoint for voice agent (inbound calls / Lilli voice) |
| **Description** | Provide a server-side endpoint that a voice provider (e.g. Twilio, Vapi, or Lilli voice service) can call for “phone order” flows. First layer: receive webhook, validate signature, return 200 and minimal payload; optionally enqueue or log event. |
| **Acceptance criteria** | • `POST /api/ai/voice/webhook` exists and validates request (e.g. signature or API key).<br>• Request/response contract documented (e.g. Twilio/Vapi/Lilli format).<br>• On valid payload: respond 200 and optionally persist `VoiceCallEvent` (e.g. `id`, `shopId`, `phoneNumber`, `direction`, `payload`, `createdAt`) for future order-creation flow.<br>• No PII logged in plain text in production. |
| **Labels** | backend, ai, voice, webhook |

---

### BLMR-AI-202 — Voice call events and link to orders

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Data model and API for voice call events and optional order creation |
| **Description** | Persist voice events and support creating an Order (or Customer) from a voice interaction. Keeps voice flow traceable and ready for “place order via phone” feature. |
| **Acceptance criteria** | • Prisma: `VoiceCallEvent` (and optional `VoiceOrderRequest` or link to existing `Order`/`Customer`).<br>• `GET /api/ai/voice/events` (or `/api/orders?source=voice`) lists voice-originated events/orders for the shop.<br>• Optional: `POST /api/ai/voice/orders` or internal service to create Order from webhook payload (first version can be minimal). |
| **Labels** | backend, voice, database, orders |

---

## 3. 24/7 Automated Customer Support

### BLMR-AI-301 — Support automation webhook and event model

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Webhook and event model for 24/7 automated support (Lilli or external bot) |
| **Description** | First-layer backend for “automated support”: receive events from Lilli or another support bot (e.g. ticket created, conversation closed), persist them, and optionally trigger internal actions (e.g. create task, notify staff). |
| **Acceptance criteria** | • `POST /api/ai/support/webhook` exists with signature/API key validation.<br>• Prisma: `SupportEvent` or `AutomationEvent` (e.g. `id`, `shopId`, `type`, `channel`, `payload`, `createdAt`).<br>• Events are stored and retrievable via `GET /api/ai/support/events` (scoped to shop).<br>• Document payload contract for Lilli repo or support provider. |
| **Labels** | backend, ai, support, webhook |

---

### BLMR-AI-302 — Support context API (customers, orders, shop)

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Read-only API for support agent to fetch customer/order/shop context |
| **Description** | Expose a minimal, secure API so Lilli or an automated support agent can fetch customer and order context (e.g. last order, contact info) when handling a conversation. Auth via API key or server-to-server token scoped to shop. |
| **Acceptance criteria** | • `GET /api/ai/support/context?customerId=...` or `?phone=...` returns safe, minimal context (e.g. customer name, last order status, shop name).<br>• Auth required; only data for the authenticated shop is returned.<br>• Rate limited; no sensitive raw PII in logs. |
| **Labels** | backend, ai, support, api |

---

## 4. Smart Order Routing

### BLMR-AI-401 — Order routing rules schema and API

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Data model and CRUD API for smart order routing rules |
| **Description** | Backend support for “smart order routing”: store rules (e.g. by delivery zone, product type, or customer segment) that determine how orders are assigned or prioritized. First layer: schema + API only; no execution engine yet. |
| **Acceptance criteria** | • Prisma: `OrderRoutingRule` (e.g. `id`, `shopId`, `name`, `priority`, `conditions` JSON, `action`/`target`, `enabled`, `createdAt`).<br>• `GET /api/ai/routing/rules` and `POST/PATCH/DELETE /api/ai/routing/rules` for CRUD, scoped to shop.<br>• Rules are not yet applied automatically; that can be a follow-up task. |
| **Labels** | backend, ai, routing, orders |

---

### BLMR-AI-402 — Routing evaluation endpoint (internal)

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Internal endpoint to evaluate routing rules for an order |
| **Description** | Provide an endpoint or internal function that, given an order (or order payload), evaluates the shop’s routing rules and returns suggested route/assignment. Allows future automation (e.g. after order creation) or Lilli to ask “where should this order go?”. |
| **Acceptance criteria** | • `POST /api/ai/routing/evaluate` accepts order-like payload (e.g. `orderId` or `{ customerId, items, deliveryZone }`).<br>• Returns `{ suggestedRoute, matchedRuleIds }` or equivalent.<br>• Only runs for authenticated shop; no side effects (read-only evaluation). |
| **Labels** | backend, ai, routing |

---

## 5. AI-Powered Campaigns

### BLMR-AI-501 — AI campaign suggestion API (first layer)

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Backend API for AI-powered campaign suggestions (integration point only) |
| **Description** | First-layer API that the frontend or a future AI service can call to request “suggestions” for a campaign (e.g. subject, audience, send time). This task is the integration point only: endpoint + contract; actual AI can live in Lilli repo or separate service. |
| **Acceptance criteria** | • `POST /api/ai/campaigns/suggest` accepts inputs (e.g. `audienceType`, `occasion`, `shopId`) and returns a defined response shape (e.g. `{ subject, bodyPreview, suggestedAudience, suggestedTime }`).<br>• First version may return static or rule-based suggestions; document extension point for LLM/Lilli.<br>• Auth and shop scoping required; rate limited. |
| **Labels** | backend, ai, campaigns, first-layer |

---

### BLMR-AI-502 — Campaign content generation webhook/queue

| Field | Value |
|-------|--------|
| **Type** | Story |
| **Summary** | Persist and process “AI-generated” campaign content requests |
| **Description** | Allow the system to request AI-generated copy for a campaign and store the request/result so broadcasts can use it. First layer: job/request model + API to enqueue and to store result when Lilli or external AI service calls back. |
| **Acceptance criteria** | • Prisma: e.g. `CampaignAIGenerationRequest` (`id`, `shopId`, `campaignId?`, `status`, `input`, `output?`, `createdAt`, `updatedAt`).<br>• `POST /api/ai/campaigns/generate` creates a request and returns `requestId`; optional webhook or polling endpoint for completion.<br>• `GET /api/ai/campaigns/generate/[id]` returns status and result for the shop. |
| **Labels** | backend, ai, campaigns, database |

---

## 6. Cross-Cutting

### BLMR-AI-601 — AI feature flags and env configuration

| Field | Value |
|-------|--------|
| **Type** | Task |
| **Summary** | Centralize AI feature flags and provider config in env and config layer |
| **Description** | Add environment variables and a small config module (e.g. `lib/ai-config.ts`) for AI features: Lilli base URL, API keys, voice webhook secret, support webhook secret, and per-feature flags (e.g. `AI_AGENT_ENABLED`, `AI_VOICE_ENABLED`). |
| **Acceptance criteria** | • `.env.example` documents all AI-related vars (with placeholder values).<br>• Single module or config object used by AI routes for URLs and keys.<br>• No secrets committed; docs updated. |
| **Labels** | backend, ai, config, devops |

---

### BLMR-AI-602 — AI API auth and rate limiting strategy

| Field | Value |
|-------|--------|
| **Type** | Task |
| **Summary** | Define and implement auth and rate limiting for all AI endpoints |
| **Description** | Standardize how AI routes authenticate (session vs API key for server-to-server, e.g. Lilli repo) and apply rate limits to prevent abuse. |
| **Acceptance criteria** | • Documented strategy: which routes use session auth vs API key.<br>• Shared middleware or helper for “AI route auth” and rate limit (e.g. per shop/user).<br>• Applied to all `/api/ai/*` routes. |
| **Labels** | backend, ai, auth, security |

---

## Summary Table

| Key | Summary | Area |
|-----|---------|------|
| BLMR-AI-101 | Lilli agent API route and auth | Lilli Agent |
| BLMR-AI-102 | Lilli agent conversations data model and API | Lilli Agent |
| BLMR-AI-103 | Lilli agent config per shop | Lilli Agent |
| BLMR-AI-201 | Voice webhook endpoint | Voice Agent |
| BLMR-AI-202 | Voice events and order link | Voice Agent |
| BLMR-AI-301 | Support automation webhook and events | 24/7 Support |
| BLMR-AI-302 | Support context API | 24/7 Support |
| BLMR-AI-401 | Order routing rules schema and CRUD | Smart Routing |
| BLMR-AI-402 | Routing evaluation endpoint | Smart Routing |
| BLMR-AI-501 | AI campaign suggestion API | AI Campaigns |
| BLMR-AI-502 | Campaign AI generation request/result persistence | AI Campaigns |
| BLMR-AI-601 | AI feature flags and env config | Cross-cutting |
| BLMR-AI-602 | AI API auth and rate limiting | Cross-cutting |

---

## Notes for Lilli Repository Integration

- **Lilli repo** can implement the actual agent logic (conversation, voice, support). Bloomer backend provides:
  - Auth (session or API key) and shop scoping.
  - Webhooks for voice and support events.
  - Context APIs (support context, routing evaluate, campaign suggest/generate).
- Recommended order for first layer: **BLMR-AI-601**, **BLMR-AI-602**, then **BLMR-AI-101**, **BLMR-AI-102**, **BLMR-AI-201**, **BLMR-AI-301**, then the rest as needed.
