# Audit Logging

Records sensitive actions for accountability and debugging.

## Logged Actions

| Action | Trigger | Metadata |
|---|---|---|
| `USER_LOGIN` | Successful NextAuth sign-in | `{ email }` |
| `CUSTOMER_CREATE` | `POST /api/customer` | `{ email, name }` |
| `CUSTOMER_UPDATE` | `PUT /api/customer` | `{ email, name }` |
| `CUSTOMER_DELETE` | `DELETE /api/customer` | — |
| `ORDER_STATUS_CHANGE` | *(pending — will be added with Square sync pipeline)* | `{ previousStatus, newStatus }` |
| `SHOP_DISCONNECT` | `POST /api/integrations/square/disconnect`, `POST /api/inbox/disconnect` | `{ merchantId }` or `{ platform }` |

## AuditLog Model

```prisma
model AuditLog {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  action     String
  userId     String   @db.ObjectId
  user       User     @relation(...)
  targetId   String?
  targetType String?
  metadata   Json?
  createdAt  DateTime @default(now())
}
```

## Creating Audit Entries

Use the helper in `lib/audit.ts`. It is fire-and-forget — errors are logged but never thrown.

```ts
import { createAuditLog } from "@/lib/audit";

await createAuditLog({
  action: "CUSTOMER_CREATE",
  userId: user.id,
  targetId: newCustomer.id,
  targetType: "Customer",
  metadata: { email: newCustomer.email },
});
```

### Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `action` | `AuditAction` | Yes | One of the action strings listed above |
| `userId` | `string` | Yes | ID of the user performing the action |
| `targetId` | `string` | No | ID of the entity acted upon |
| `targetType` | `string` | No | Model name (e.g. `"Customer"`, `"SquareIntegration"`) |
| `metadata` | `Record<string, unknown>` | No | Arbitrary context (old/new values, IPs, etc.) |

## GET /api/audit

Admin-only. Requires `user.role === "admin"`.

### Query Parameters

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `25` | Items per page (max 100) |
| `action` | `string` | — | Filter by action type |
| `userId` | `string` | — | Filter by user ID |
| `startDate` | `string` | — | ISO date, inclusive lower bound |
| `endDate` | `string` | — | ISO date, inclusive upper bound |

### Response

```json
{
  "logs": [
    {
      "id": "...",
      "action": "USER_LOGIN",
      "userId": "...",
      "targetId": null,
      "targetType": null,
      "metadata": { "email": "user@example.com" },
      "createdAt": "2026-03-18T18:30:00.000Z",
      "user": {
        "id": "...",
        "email": "user@example.com",
        "firstName": "Jane",
        "lastName": "Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6
  }
}
```

### Error Responses

| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | User is not an admin |
| 500 | Server error |

## Security Notes

- Audit entries are **append-only** — there is no update or delete endpoint.
- The `metadata` field should never contain passwords, tokens, or secrets.
- Access to the GET endpoint is restricted to admin users via the `role` field on the User model.

## Tests

Run audit logging tests:

```sh
npx vitest run lib/audit.test.ts
```
