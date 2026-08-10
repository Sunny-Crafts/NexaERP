import { PrismaClient, Role, CustomerType, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for NexaERP...');

  // ----------------------------------------------------
  // 1. SEED USERS (Hashed passwords with bcrypt)
  // ----------------------------------------------------
  const defaultSaltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@123', defaultSaltRounds);
  const salesPasswordHash = await bcrypt.hash('Sales@123', defaultSaltRounds);
  const warehousePasswordHash = await bcrypt.hash('Warehouse@123', defaultSaltRounds);
  const accountsPasswordHash = await bcrypt.hash('Accounts@123', defaultSaltRounds);

  const users = [
    {
      name: 'System Administrator',
      email: 'admin@nexaerp.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN
    },
    {
      name: 'Sales Manager',
      email: 'sales@nexaerp.com',
      passwordHash: salesPasswordHash,
      role: Role.SALES
    },
    {
      name: 'Warehouse Supervisor',
      email: 'warehouse@nexaerp.com',
      passwordHash: warehousePasswordHash,
      role: Role.WAREHOUSE
    },
    {
      name: 'Accounts Executive',
      email: 'accounts@nexaerp.com',
      passwordHash: accountsPasswordHash,
      role: Role.ACCOUNTS
    }
  ];

  console.log('👤 Seeding users...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash: user.passwordHash,
        role: user.role
      },
      create: user
    });
    console.log(`  ✓ User created/updated: ${user.email} (${user.role})`);
  }

  // ----------------------------------------------------
  // 2. SEED PRODUCTS
  // ----------------------------------------------------
  const products = [
    {
      name: 'Wireless Mouse Pro',
      sku: 'MOU-WL-001',
      category: 'Peripherals',
      unitPrice: 799.00,
      currentStock: 150,
      minimumStock: 20,
      warehouseLocation: 'Rack A-01'
    },
    {
      name: 'Mechanical Gaming Keyboard RGB',
      sku: 'KEY-MECH-002',
      category: 'Peripherals',
      unitPrice: 2499.00,
      currentStock: 80,
      minimumStock: 15,
      warehouseLocation: 'Rack A-02'
    },
    {
      name: 'USB-C Fast Charging Cable (2m)',
      sku: 'CAB-USBC-003',
      category: 'Accessories',
      unitPrice: 299.00,
      currentStock: 300,
      minimumStock: 50,
      warehouseLocation: 'Bin B-12'
    },
    {
      name: 'Ergonomic Aluminum Laptop Stand',
      sku: 'ACC-LST-004',
      category: 'Accessories',
      unitPrice: 1299.00,
      currentStock: 45,
      minimumStock: 10,
      warehouseLocation: 'Rack C-05'
    },
    {
      name: '4K Ultra High-Speed HDMI Cable (1.8m)',
      sku: 'CAB-HDMI-005',
      category: 'Cables',
      unitPrice: 449.00,
      currentStock: 200,
      minimumStock: 30,
      warehouseLocation: 'Bin B-14'
    }
  ];

  console.log('📦 Seeding products...');
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        category: product.category,
        unitPrice: product.unitPrice,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
        warehouseLocation: product.warehouseLocation
      },
      create: product
    });
    console.log(`  ✓ Product created/updated: ${product.name} [SKU: ${product.sku}]`);
  }

  // ----------------------------------------------------
  // 3. SEED CUSTOMERS
  // ----------------------------------------------------
  const customers = [
    {
      name: 'Rajesh Sharma',
      mobile: '+91 98765 43210',
      email: 'contact@apexretail.com',
      businessName: 'Apex Retail Enterprises Pvt Ltd',
      gstNumber: '27AABCU9603R1ZM',
      customerType: CustomerType.RETAIL,
      status: CustomerStatus.ACTIVE,
      address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, MH - 400093',
      notes: 'Key retail account. Prefers bulk consolidated shipments at month start.'
    },
    {
      name: 'Vikram Mehta',
      mobile: '+91 98123 45678',
      email: 'orders@zenithwholesale.com',
      businessName: 'Zenith Wholesale Mart',
      gstNumber: '29AADCB2212P1ZT',
      customerType: CustomerType.WHOLESALE,
      status: CustomerStatus.ACTIVE,
      address: 'Sector 18, Electronic City Phase 1, Bengaluru, KA - 560100',
      notes: 'Wholesale distributor for South regional stores. Standard 30-day net credit.'
    },
    {
      name: 'Ananya Gupta',
      mobile: '+91 97234 56789',
      email: 'procurement@nexustech.com',
      businessName: 'Nexus Tech Distribution LLP',
      gstNumber: '07AAGCN1234F1ZQ',
      customerType: CustomerType.DISTRIBUTOR,
      status: CustomerStatus.ACTIVE,
      address: 'Barakhamba Road, Connaught Place, New Delhi, DL - 110001',
      notes: 'Master distributor channel for North and NCR markets.'
    },
    {
      name: 'Suresh Kumar',
      mobile: '+91 96345 67890',
      email: 'info@metroelectronics.in',
      businessName: 'Metro Electronic Solutions',
      gstNumber: '33AAACM5544K1ZS',
      customerType: CustomerType.RETAIL,
      status: CustomerStatus.LEAD,
      address: 'Anna Salai, Mount Road, Chennai, TN - 600002',
      followUpDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      notes: 'Prospective lead from Tech Expo. Requested catalog pricing on peripherals.'
    }
  ];

  console.log('🏢 Seeding customers...');
  for (const customer of customers) {
    const existing = await prisma.customer.findFirst({
      where: { mobile: customer.mobile }
    });

    if (existing) {
      await prisma.customer.update({
        where: { id: existing.id },
        data: customer
      });
      console.log(`  ✓ Customer updated: ${customer.businessName} (${customer.customerType})`);
    } else {
      await prisma.customer.create({
        data: customer
      });
      console.log(`  ✓ Customer created: ${customer.businessName} (${customer.customerType})`);
    }
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
