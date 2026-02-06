import db from "@/lib/prisma";
/*
gte	≥	greater than or equal
gt	>	greater than
lte	≤	less than or equal
lt	<	less than
*/

export async function getAllCustomers(shopId: string) {
  return db.customer.findMany({
    where: {shopId},
  });
}

export async function getNewCustomers(shopId: string) {
  // Date.now is in milliseconds
  // hours --> minutes --> seconds --> milliseconds
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return db.customer.findMany({
    where: {
      shopId,
      createdAt: {gte: since},
    },
  });
}

export async function getVipCustomers(shopId: string) {
  return db.customer.findMany({
    where: {
      shopId,
      group: "VIP",
    },
  });
}

export async function getHighSpenders(shopId: string) {
  return db.customer.findMany({
    where: {
      shopId,
      spendAmount: {gte: 3000},
    },
  });
}

/**
Month	JSvalue
January	0
February	1
March	2
April	3
…	…
December	11
 */
export async function getBirthdayNextMonth(shopId: string) {
  const today = new Date();
  // JS months: 0–11 and December edge case
  const nextMonth = ((today.getMonth() + 1) % 12) + 1;

  return db.customer.findMany({
    where: {
      shopId,
      birthMonth: nextMonth,
    },
  });
}

export async function getInactiveCustomers(shopId: string) {
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  /* In SQL
  SELECT * FROM customers WHERE customers.id NOT IN (
  SELECT customer_id
  FROM orders
  WHERE created_at >= NOW() - INTERVAL '90 days'
  );
 */
  return db.customer.findMany({
    where: {
      shopId,
      orders: {
        none: {
          createdAt: {
            gte: since,
          },
        },
      },
    },
  });
}
