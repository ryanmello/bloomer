import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  if (isDryRun) {
    console.log("=== DRY RUN MODE - No data will be deleted ===\n");
  }
  console.log("Starting migration script...\n");

  // 1. Find customers without shopId
  // @ts-ignore - shopId may be null in DB even though schema now requires it
  const orphanedCustomers = await prisma.customer.findMany({
    where: { shopId: null as any },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  console.log(`Found ${orphanedCustomers.length} customers without a shopId`);

  if (orphanedCustomers.length > 0) {
    console.log("Orphaned customers that will be deleted:");
    orphanedCustomers.forEach((c) => {
      console.log(`  - ${c.firstName} ${c.lastName} (${c.email})`);
    });

    if (!isDryRun) {
      // Delete orphaned customers (their orders and addresses will cascade delete)
      const deleteResult = await prisma.customer.deleteMany({
        where: { shopId: null as any },
      });
      console.log(`\nDeleted ${deleteResult.count} orphaned customers\n`);
    } else {
      console.log(`\n[DRY RUN] Would delete ${orphanedCustomers.length} customers\n`);
    }
  }

  // 2. Find and count related data that will cascade delete
  if (orphanedCustomers.length > 0) {
    const orphanedCustomerIds = orphanedCustomers.map((c) => c.id);

    const ordersCount = await prisma.order.count({
      where: { customerId: { in: orphanedCustomerIds } },
    });

    const addressesCount = await prisma.address.count({
      where: { customerId: { in: orphanedCustomerIds } },
    });

    const campaignRecipientsCount = await prisma.campaignRecipient.count({
      where: { customerId: { in: orphanedCustomerIds } },
    });

    console.log("Related data that will cascade delete:");
    console.log(`  - ${ordersCount} orders`);
    console.log(`  - ${addressesCount} addresses`);
    console.log(`  - ${campaignRecipientsCount} campaign recipients\n`);
  }

  // 3. Delete all audiences (they have no shopId and need to be recreated)
  const audiences = await prisma.audience.findMany({
    select: { id: true, name: true, status: true },
  });

  console.log(`Found ${audiences.length} audiences without shopId`);

  if (audiences.length > 0) {
    console.log("Audiences that will be deleted:");
    audiences.forEach((a) => {
      console.log(`  - ${a.name} (${a.status})`);
    });

    if (!isDryRun) {
      const deleteResult = await prisma.audience.deleteMany({});
      console.log(`\nDeleted ${deleteResult.count} audiences\n`);
    } else {
      console.log(`\n[DRY RUN] Would delete ${audiences.length} audiences\n`);
    }
  }

  if (isDryRun) {
    console.log("=== DRY RUN COMPLETE - No data was deleted ===");
    console.log("\nTo actually run the migration, remove the --dry-run flag:");
    console.log("npx tsx scripts/migrate-shop-relationships.ts");
  } else {
    console.log("Migration complete!");
    console.log("\nNext steps:");
    console.log("1. Run: npx prisma db push");
    console.log("2. Run: npx prisma generate");
  }
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
