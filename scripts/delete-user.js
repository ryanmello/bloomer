const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser(email) {
  try {
    // First, check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        shops: true,
        coupons: true,
        campaigns: true,
        emailIntegrations: true,
      },
    });

    if (!user) {
      console.log(`User with email ${email} not found.`);
      return;
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`Associated data:`);
    console.log(`  - Shops: ${user.shops.length}`);
    console.log(`  - Coupons: ${user.coupons.length}`);
    console.log(`  - Campaigns: ${user.campaigns.length}`);
    console.log(`  - Email Integrations: ${user.emailIntegrations.length}`);

    // Delete the user (cascade will handle related data)
    await prisma.user.delete({
      where: { email },
    });

    console.log(`\n✅ Successfully deleted user account: ${email}`);
    console.log(`All associated data has been removed (shops, coupons, campaigns, etc.)`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/delete-user.js <email>');
  console.error('Example: node scripts/delete-user.js ari.hernandez0010@gmail.com');
  process.exit(1);
}

deleteUser(email)
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFailed to delete user:', error);
    process.exit(1);
  });
