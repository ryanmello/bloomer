import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Find Testshop1
  const shop = await db.shop.findFirst({
    where: { name: 'Testshop1' },
    include: { user: true }
  });
  if (!shop) {
    console.error('❌ Testshop1 not found.');
    return;
  }

  const user = shop.user;
  console.log(`✅ Found user: ${user.email}`);
  console.log(`✅ Found shop: ${shop.name}`);

  // Create test customers with various birthdays
  const today = new Date();
  const customers = [
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phoneNumber: '555-0101',
      dateOfBirth: new Date(1990, today.getMonth(), today.getDate() + 3), // Birthday in 3 days
    },
    {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      phoneNumber: '555-0102',
      dateOfBirth: new Date(1985, today.getMonth(), today.getDate() + 7), // Birthday in 7 days
    },
    {
      firstName: 'Carol',
      lastName: 'Williams',
      email: 'carol@example.com',
      phoneNumber: '555-0103',
      dateOfBirth: new Date(1992, today.getMonth(), today.getDate()), // Birthday today
    },
    {
      firstName: 'David',
      lastName: 'Brown',
      email: 'david@example.com',
      phoneNumber: '555-0104',
      dateOfBirth: new Date(1988, 5, 15), // Random birthday
    },
    {
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma@example.com',
      phoneNumber: '555-0105',
      dateOfBirth: new Date(1995, 11, 25), // Christmas baby
    },
  ];

  console.log('\n📧 Creating customers...');
  const createdCustomers = [];
  for (const customer of customers) {
    const existing = await db.customer.findFirst({
      where: { email: customer.email, shopId: shop.id },
    });
    if (existing) {
      console.log(`  ⏭️  ${customer.firstName} ${customer.lastName} already exists`);
      createdCustomers.push(existing);
    } else {
      const created = await db.customer.create({
        data: {
          ...customer,
          shopId: shop.id,
        },
      });
      console.log(`  ✅ Created ${customer.firstName} ${customer.lastName}`);
      createdCustomers.push(created);
    }
  }

  // Create test coupons
  const coupons = [
    // Customer-based coupons
    { codeName: 'WELCOME10', discount: 10, description: 'New customer welcome discount' },
    { codeName: 'BIRTHDAY15', discount: 15, description: 'Birthday special' },
    { codeName: 'VIP20', discount: 20, description: 'VIP customer exclusive' },
    { codeName: 'COMEBACK25', discount: 25, description: 'Win-back offer' },
    { codeName: 'ANNIVERSARY10', discount: 10, description: 'Customer anniversary' },
    // Holiday coupons
    { codeName: 'VDAY15', discount: 15, description: "Valentine's Day special" },
    { codeName: 'MOMDAY20', discount: 20, description: "Mother's Day special" },
    { codeName: 'XMAS15', discount: 15, description: 'Christmas special' },
    { codeName: 'THANKS10', discount: 10, description: 'Thanksgiving special' },
    { codeName: 'EASTER15', discount: 15, description: 'Easter special' },
    { codeName: 'ADMIN10', discount: 10, description: 'Admin Professionals Day' },
    { codeName: 'WOMENSDAY15', discount: 15, description: "International Women's Day" },
    { codeName: 'MEMORIAL10', discount: 10, description: 'Memorial Day special' },
    { codeName: 'MENSDAY15', discount: 15, description: "International Men's Day" },
  ];

  console.log('\n🎟️  Creating coupons...');
  for (const coupon of coupons) {
    const existing = await db.coupon.findUnique({
      where: { codeName: coupon.codeName },
    });
    if (existing) {
      console.log(`  ⏭️  ${coupon.codeName} already exists`);
    } else {
      await db.coupon.create({
        data: {
          ...coupon,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
          userId: user.id,
        },
      });
      console.log(`  ✅ Created ${coupon.codeName} (${coupon.discount}% off)`);
    }
  }

  // Create test audiences
  const audiences = [
    {
      name: 'VIP Customers',
      description: 'High-value repeat customers',
      customerIds: createdCustomers.slice(0, 2).map(c => c.id), // Alice & Bob
    },
    {
      name: 'Birthday Club',
      description: 'Customers who opted into birthday rewards',
      customerIds: createdCustomers.slice(0, 3).map(c => c.id), // Alice, Bob, Carol
    },
    {
      name: 'New Customers',
      description: 'Recently acquired customers',
      customerIds: createdCustomers.slice(3).map(c => c.id), // David & Emma
    },
  ];

  console.log('\n👥 Creating audiences...');
  for (const audience of audiences) {
    const existing = await db.audience.findFirst({
      where: { name: audience.name, shopId: shop.id },
    });
    if (existing) {
      console.log(`  ⏭️  ${audience.name} already exists`);
    } else {
      await db.audience.create({
        data: {
          name: audience.name,
          description: audience.description,
          customerIds: audience.customerIds,
          status: 'active',
          type: 'custom',
          shopId: shop.id,
          userId: user.id,
        },
      });
      console.log(`  ✅ Created ${audience.name} (${audience.customerIds.length} customers)`);
    }
  }

  console.log('\n✨ Seed completed!');
  console.log('\nSummary:');
  console.log(`  - ${customers.length} customers`);
  console.log(`  - ${coupons.length} coupons`);
  console.log(`  - ${audiences.length} audiences`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
