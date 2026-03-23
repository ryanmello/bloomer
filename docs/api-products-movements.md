# Inventory Movement History API

**Endpoint:** `GET /api/products/[id]/movements`

**Work items:** UN-770, UN-771

## Overview

Returns a paginated list of `InventoryMovement` records for a specific product. Used for audit/history view in the UI.

## Authentication

- **Required:** Yes (session-based via NextAuth)
- **Authorization:** Product must belong to a shop owned by the authenticated user
- Returns `401 Unauthorized` if not authenticated
- Returns `403 Forbidden` if the product belongs to another user's shop
- Returns `404 Not Found` if the product does not exist

## Request

### Path parameters

| Parameter | Description      |
|-----------|------------------|
| `id`      | Product ID (ObjectId) |

### Query parameters

| Parameter | Type   | Default | Description                                      |
|-----------|--------|---------|--------------------------------------------------|
| `limit`   | number | 20      | Items per page (max 100)                         |
| `cursor`  | string | —       | Opaque cursor for next page (from previous response) |

### Example

```
GET /api/products/507f1f77bcf86cd799439011/movements
GET /api/products/507f1f77bcf86cd799439011/movements?limit=50
GET /api/products/507f1f77bcf86cd799439011/movements?cursor=eyJpZCI6Ij...
```

## Response

### Success (200 OK)

```json
{
  "items": [
    {
      "id": "674a1b2c3d4e5f6789012345",
      "type": "adjustment",
      "quantity": 5,
      "previousInventory": 10,
      "newInventory": 15,
      "reason": "Restock from supplier",
      "notes": null,
      "createdAt": "2025-03-11T12:00:00.000Z"
    },
    {
      "id": "674a1b2c3d4e5f6789012346",
      "type": "sale",
      "quantity": -2,
      "previousInventory": 15,
      "newInventory": 13,
      "reason": "Customer order #123",
      "notes": null,
      "createdAt": "2025-03-11T10:30:00.000Z"
    }
  ],
  "nextCursor": "eyJpZCI6Ijc...",
  "hasMore": true
}
```

### Response fields

| Field        | Type    | Description                                     |
|--------------|---------|-------------------------------------------------|
| `items`      | array   | Array of movement records (most recent first)  |
| `nextCursor` | string? | Cursor for next page; `null` if no more pages  |
| `hasMore`    | boolean | Whether more results exist                     |

### Movement item fields

| Field              | Type    | Description                                        |
|--------------------|---------|----------------------------------------------------|
| `id`               | string  | Movement record ID                                 |
| `type`             | string  | One of: `purchase`, `sale`, `adjustment`, `waste`, `return` |
| `quantity`         | number  | Change amount (positive = add, negative = remove)  |
| `previousInventory`| number  | Stock before the movement                          |
| `newInventory`     | number  | Stock after the movement                           |
| `reason`           | string? | Optional reason (e.g., "Damaged", "Order #123")   |
| `notes`            | string? | Optional notes                                    |
| `createdAt`        | string  | ISO 8601 timestamp                                 |

### Errors

| Status | Body                                        | Condition                    |
|--------|---------------------------------------------|------------------------------|
| 401    | `{ "error": "Unauthorized" }`                | Not authenticated             |
| 403    | `{ "error": "Unauthorized to view this product" }` | Product belongs to another user |
| 404    | `{ "error": "Product not found" }`           | Invalid or non-existent product ID |
| 500    | `{ "error": "Failed to load movement history" }` | Server error           |

## Pagination

- **Cursor-based:** Use `nextCursor` from the response as the `cursor` query param for the next page
- **Limit:** Between 1 and 100 items per request
- **Order:** Items sorted by `createdAt` descending (most recent first)

## Usage example

```typescript
// Fetch first page
const res = await fetch('/api/products/507f1f77bcf86cd799439011/movements?limit=20');
const { items, nextCursor, hasMore } = await res.json();

// Fetch next page (if hasMore)
if (hasMore && nextCursor) {
  const nextRes = await fetch(
    `/api/products/507f1f77bcf86cd799439011/movements?limit=20&cursor=${nextCursor}`
  );
  const nextData = await nextRes.json();
}
```
