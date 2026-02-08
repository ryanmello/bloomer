import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  if (isDryRun) {
    console.log("=== DRY RUN MODE - No data will be deleted ===\n");
  }
  console.log("Starting migration script...\n");

  // 1. Find customers without shopId using raw MongoDB query
  const customerResult = await prisma.$runCommandRaw({
    find: "Customer",
    filter: { shopId: null },
    projection: { _id: 1, firstName: 1, lastName: 1, email: 1 }
  }) as any;

  const orphanedCustomers = customerResult.cursor?.firstBatch || [];
  console.log(`Found ${orphanedCustomers.length} customers without a shopId`);

  if (orphanedCustomers.length > 0) {
    console.log("Orphaned customers that will be deleted:");
    orphanedCustomers.forEach((c: any) => {
      console.log(`  - ${c.firstName} ${c.lastName} (${c.email})`);
    });

    if (!isDryRun) {
      const deleteResult = await prisma.$runCommandRaw({
        delete: "Customer",
        deletes: [{ q: { shopId: null }, limit: 0 }]
      }) as any;
      console.log(`\nDeleted ${deleteResult.n || 0} orphaned customers\n`);
    } else {
      console.log(`\n[DRY RUN] Would delete ${orphanedCustomers.length} customers\n`);
    }
  }

  // 2. Find and delete all audiences using raw MongoDB query
  const audienceResult = await prisma.$runCommandRaw({
    find: "Audience",
    filter: {},
    projection: { _id: 1, name: 1, status: 1 }
  }) as any;

  const audiences = audienceResult.cursor?.firstBatch || [];
  console.log(`Found ${audiences.length} audiences to delete`);

  if (audiences.length > 0) {
    console.log("Audiences that will be deleted:");
    audiences.forEach((a: any) => {
      console.log(`  - ${a.name} (${a.status})`);
    });

    if (!isDryRun) {
      const deleteResult = await prisma.$runCommandRaw({
        delete: "Audience",
        deletes: [{ q: {}, limit: 0 }]
      }) as any;
      console.log(`\nDeleted ${deleteResult.n || 0} audiences\n`);
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
