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

  // Helper to get future date handling month overflow
  const getFutureDate = (daysFromNow: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  const aliceBirthday = getFutureDate(3);
  const bobBirthday = getFutureDate(7);
  const carolBirthday = today; // Birthday today

  const customers = [
    {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice@example.com',
      phoneNumber: '555-0101',
      dateOfBirth: new Date(1990, aliceBirthday.getMonth(), aliceBirthday.getDate()),
      birthMonth: aliceBirthday.getMonth() + 1, // 1-12
      birthDay: aliceBirthday.getDate(), // 1-31
    },
    {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob@example.com',
      phoneNumber: '555-0102',
      dateOfBirth: new Date(1985, bobBirthday.getMonth(), bobBirthday.getDate()),
      birthMonth: bobBirthday.getMonth() + 1,
      birthDay: bobBirthday.getDate(),
    },
    {
      firstName: 'Carol',
      lastName: 'Williams',
      email: 'carol@example.com',
      phoneNumber: '555-0103',
      dateOfBirth: new Date(1992, carolBirthday.getMonth(), carolBirthday.getDate()),
      birthMonth: carolBirthday.getMonth() + 1,
      birthDay: carolBirthday.getDate(),
    },
    {
      firstName: 'David',
      lastName: 'Brown',
      email: 'david@example.com',
      phoneNumber: '555-0104',
      dateOfBirth: new Date(1988, 5, 15),
      birthMonth: 6, // June
      birthDay: 15,
    },
    {
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma@example.com',
      phoneNumber: '555-0105',
      dateOfBirth: new Date(1995, 11, 25),
      birthMonth: 12, // December
      birthDay: 25,
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

  // Create test automations
  const automations = [
    {
      name: 'Birthday Special',
      description: 'Send birthday wishes 3 days before their birthday',
      category: 'lifecycle',
      triggerType: 'birthday',
      timing: 3, // 3 days before
      actionType: 'send_email',
      status: 'active',
      emailSubject: 'Happy Birthday {{firstName}}! 🎂 A special gift awaits',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e91e63;">Happy Birthday, {{firstName}}! 🎉</h1>
          <p>We hope your special day is filled with joy and beautiful blooms!</p>
          <p>As a birthday treat, enjoy <strong>15% off</strong> your next order with code: <strong>BIRTHDAY15</strong></p>
          <p>Wishing you a wonderful celebration!</p>
          <p>With love,<br>{{shopName}}</p>
        </div>
      `,
    },
    {
      name: 'Birthday Today',
      description: 'Send birthday wishes on their birthday',
      category: 'lifecycle',
      triggerType: 'birthday',
      timing: 0, // On their birthday
      actionType: 'send_email',
      status: 'active',
      emailSubject: 'It\'s your birthday {{firstName}}! 🎈',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #e91e63;">Happy Birthday, {{firstName}}! 🎂</h1>
          <p>Today is YOUR day! We're so grateful to have you as a customer.</p>
          <p>Celebrate with <strong>15% off</strong> using code: <strong>BIRTHDAY15</strong></p>
          <p>Have an amazing birthday!</p>
          <p>Cheers,<br>{{shopName}}</p>
        </div>
      `,
    },
    {
      name: 'Welcome New Customer',
      description: 'Welcome email sent immediately after signup',
      category: 'lifecycle',
      triggerType: 'new_customer',
      timing: 0, // Same day
      actionType: 'send_email',
      status: 'active',
      emailSubject: 'Welcome to {{shopName}}, {{firstName}}! 🌸',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4caf50;">Welcome, {{firstName}}! 🌷</h1>
          <p>Thank you for joining our flower family!</p>
          <p>As a welcome gift, here's <strong>10% off</strong> your first order: <strong>WELCOME10</strong></p>
          <p>We can't wait to help you brighten someone's day!</p>
          <p>Best,<br>{{shopName}}</p>
        </div>
      `,
    },
    {
      name: 'We Miss You',
      description: 'Re-engagement email for inactive customers',
      category: 'lifecycle',
      triggerType: 'inactive',
      timing: 30, // 30 days without purchase
      actionType: 'send_email',
      status: 'active',
      emailSubject: 'We miss you, {{firstName}}! 💐',
      emailBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ff9800;">We Miss You, {{firstName}}! 🌻</h1>
          <p>It's been a while since your last visit, and we wanted to check in.</p>
          <p>Come back and enjoy <strong>25% off</strong> with code: <strong>COMEBACK25</strong></p>
          <p>We'd love to see you again!</p>
          <p>Warmly,<br>{{shopName}}</p>
        </div>
      `,
    },
  ];

  console.log('\n🤖 Creating automations...');
  for (const automation of automations) {
    const existing = await db.automation.findFirst({
      where: { name: automation.name, shopId: shop.id },
    });
    if (existing) {
      console.log(`  ⏭️  ${automation.name} already exists`);
    } else {
      await db.automation.create({
        data: {
          ...automation,
          shopId: shop.id,
        },
      });
      console.log(`  ✅ Created ${automation.name} (${automation.triggerType}, timing: ${automation.timing})`);
    }
  }

  console.log('\n✨ Seed completed!');
  console.log('\nSummary:');
  console.log(`  - ${customers.length} customers`);
  console.log(`  - ${coupons.length} coupons`);
  console.log(`  - ${audiences.length} audiences`);
  console.log(`  - ${automations.length} automations`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
