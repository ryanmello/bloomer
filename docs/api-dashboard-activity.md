# Recent Activity Feed API

**Endpoint:** `GET /api/dashboard/activity`

**Work items:** UN-747, UN-748, UN-749, UN-752

## Overview

Returns a unified feed of recent events for the authenticated user's active shop:

- **New orders** – From Prisma `Order` model or Square sync (when connected)
- **New customers** – From Prisma `Customer` model
- **Low stock alerts** – Products where `quantity <= lowInventoryAlert`
- **Inventory adjustments** – From `InventoryMovement` model

## Authentication

- **Required:** Yes (session-based via NextAuth)
- **Authorization:** User must own the shop (active shop from cookie or `shopId` query param)
- Returns `401 Unauthorized` if not authenticated
- Returns empty feed if user has no shop

## Request

### Query parameters

| Parameter | Type   | Default | Description                                      |
|-----------|--------|---------|--------------------------------------------------|
| `limit`   | number | 10      | Items per page (max 50)                          |
| `cursor`  | string | —       | Opaque cursor for next page (from previous response) |
| `shopId`  | string | (cookie)| Filter by shop ID; uses `activeShopId` cookie if omitted |

### Example

```
GET /api/dashboard/activity?limit=10
GET /api/dashboard/activity?limit=20&cursor=eyJjcmVhdGVkQXQiOiI...
GET /api/dashboard/activity?shopId=abc123&limit=15
```

## Response

### Success (200 OK)

```json
{
  "items": [
    {
      "type": "order",
      "id": "ord_123",
      "createdAt": "2025-03-11T12:00:00.000Z",
      "source": "prisma",
      "data": {
        "totalAmount": 49.99,
        "status": "COMPLETED",
        "customerName": "Jane Doe"
      }
    },
    {
      "type": "customer",
      "id": "cust_456",
      "createdAt": "2025-03-11T11:30:00.000Z",
      "data": {
        "name": "John Smith",
        "email": "john@example.com"
      }
    },
    {
      "type": "low_stock",
      "id": "prod_789",
      "createdAt": "2025-03-11T10:00:00.000Z",
      "data": {
        "productName": "Roses",
        "quantity": 5,
        "threshold": 10
      }
    },
    {
      "type": "inventory_adjustment",
      "id": "mov_012",
      "createdAt": "2025-03-11T09:00:00.000Z",
      "data": {
        "productName": "Tulips",
        "quantity": -3,
        "type": "sale",
        "reason": "Customer order #123"
      }
    }
  ],
  "nextCursor": "eyJjcmVhdGVkQXQiOiI...",
  "hasMore": true
}
```

### Activity item types

| Type                  | `data` fields                                                      |
|-----------------------|---------------------------------------------------------------------|
| `order`               | `totalAmount`, `currency`, `status`, `customerName`, `source`       |
| `customer`            | `name`, `email`                                                    |
| `low_stock`           | `productName`, `quantity`, `threshold`                              |
| `inventory_adjustment`| `productName`, `quantity`, `type`, `reason`                        |

### Errors

| Status | Body                 | Condition                    |
|--------|----------------------|------------------------------|
| 401    | `{ "error": "Unauthorized" }` | Not authenticated         |
| 500    | `{ "error": "Failed to load activity feed" }` | Server error         |

### Empty feed (200)

If the user has no shop, the API returns a valid empty response:

```json
{
  "items": [],
  "nextCursor": null,
  "hasMore": false
}
```

## Pagination

- **Cursor-based:** Use `nextCursor` from the response as the `cursor` query param for the next page
- **Limit:** Between 1 and 50 items per request
- **Order:** Items sorted by `createdAt` descending (most recent first)

## Shop filtering

- Default: uses the `activeShopId` cookie set by the user
- Override: pass `shopId` query param (must belong to the authenticated user)
- If neither yields a valid shop, returns an empty feed
