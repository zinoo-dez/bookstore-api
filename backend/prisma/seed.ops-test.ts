import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
const MARKER = '[OPS_TEST_SEED]';

const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const randomFrom = <T>(items: T[], index: number) => items[index % items.length];

async function ensureWarehouses() {
  const defaults = [
    {
      code: 'WH-LA-OPS',
      name: 'Los Angeles Ops Warehouse',
      city: 'Los Angeles',
      state: 'CA',
      address: `${MARKER} 221 Harbor St, Los Angeles, CA`,
      isActive: true,
    },
    {
      code: 'WH-NY-OPS',
      name: 'New York Ops Warehouse',
      city: 'New York',
      state: 'NY',
      address: `${MARKER} 80 Commerce Ave, New York, NY`,
      isActive: true,
    },
    {
      code: 'WH-TX-OPS',
      name: 'Dallas Ops Warehouse',
      city: 'Dallas',
      state: 'TX',
      address: `${MARKER} 15 Trinity Park, Dallas, TX`,
      isActive: true,
    },
  ];

  return Promise.all(
    defaults.map((warehouse) =>
      prisma.warehouse.upsert({
        where: { code: warehouse.code },
        update: warehouse,
        create: warehouse,
      }),
    ),
  );
}

async function ensureStores() {
  const defaults = [
    {
      code: 'STORE-SF-OPS',
      name: 'Downtown SF Store',
      city: 'San Francisco',
      state: 'CA',
      address: `${MARKER} 101 Market St, San Francisco, CA`,
      phone: '+1-415-555-0191',
      email: 'sf.ops.store@example.local',
      isActive: true,
      deletedAt: null,
    },
    {
      code: 'STORE-NYC-OPS',
      name: 'Manhattan Reader Hub',
      city: 'New York',
      state: 'NY',
      address: `${MARKER} 7 Madison Ave, New York, NY`,
      phone: '+1-212-555-0192',
      email: 'nyc.ops.store@example.local',
      isActive: true,
      deletedAt: null,
    },
    {
      code: 'STORE-AUS-OPS',
      name: 'Austin Campus Store',
      city: 'Austin',
      state: 'TX',
      address: `${MARKER} 44 Congress Ave, Austin, TX`,
      phone: '+1-512-555-0193',
      email: 'aus.ops.store@example.local',
      isActive: true,
      deletedAt: null,
    },
  ];

  return Promise.all(
    defaults.map((store) =>
      prisma.store.upsert({
        where: { code: store.code },
        update: store,
        create: store,
      }),
    ),
  );
}

async function ensureVendors() {
  const defaults = [
    {
      code: 'OPS-MERIDIAN',
      name: 'Meridian Book Supply',
      contactName: 'Ops Procurement Desk',
      email: 'procurement@meridian.example.local',
      phone: '+1-323-555-0141',
      address: `${MARKER} 900 Supply Rd, Los Angeles, CA`,
      isActive: true,
      deletedAt: null,
    },
    {
      code: 'OPS-ORBIT',
      name: 'Orbit Educational Distribution',
      contactName: 'Vendor Success',
      email: 'vendors@orbit.example.local',
      phone: '+1-917-555-0142',
      address: `${MARKER} 210 Publisher Row, New York, NY`,
      isActive: true,
      deletedAt: null,
    },
    {
      code: 'OPS-NOVA',
      name: 'Nova Wholesale Press',
      contactName: 'Account Manager',
      email: 'accounts@nova.example.local',
      phone: '+1-737-555-0143',
      address: `${MARKER} 52 Print Works, Austin, TX`,
      isActive: true,
      deletedAt: null,
    },
  ];

  return Promise.all(
    defaults.map((vendor) =>
      prisma.vendor.upsert({
        where: { code: vendor.code },
        update: vendor,
        create: vendor,
      }),
    ),
  );
}

async function main() {
  console.log('🌱 Starting ops test seed (non-destructive)...');

  const [users, books] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      take: 60,
    }),
    prisma.book.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 40,
    }),
  ]);

  if (users.length === 0) {
    throw new Error('No users found. Seed users first.');
  }
  if (books.length < 6) {
    throw new Error('Not enough books found. Seed books first.');
  }

  const adminOrSuper =
    users.find((user) => user.role === Role.SUPER_ADMIN) ??
    users.find((user) => user.role === Role.ADMIN) ??
    users[0];
  const customers = users.filter((user) => user.role === Role.USER).slice(0, 12);
  const orderUsers = customers.length > 0 ? customers : users.slice(0, 12);

  const [warehouses, stores, vendors] = await Promise.all([
    ensureWarehouses(),
    ensureStores(),
    ensureVendors(),
  ]);

  // Ensure warehouse stock exists for first 20 books across warehouses.
  for (let i = 0; i < 20; i += 1) {
    const warehouse = randomFrom(warehouses, i);
    const book = randomFrom(books, i);
    await prisma.warehouseStock.upsert({
      where: {
        warehouseId_bookId: {
          warehouseId: warehouse.id,
          bookId: book.id,
        },
      },
      update: {
        stock: 18 + (i % 35),
        lowStockThreshold: 5 + (i % 4),
      },
      create: {
        warehouseId: warehouse.id,
        bookId: book.id,
        stock: 18 + (i % 35),
        lowStockThreshold: 5 + (i % 4),
        createdAt: daysAgo(30 - i),
        updatedAt: daysAgo(4 + (i % 3)),
      },
    });
  }

  // Ensure store stock exists for first 18 books across stores.
  for (let i = 0; i < 18; i += 1) {
    const store = randomFrom(stores, i);
    const book = randomFrom(books, i + 5);
    await prisma.storeStock.upsert({
      where: {
        storeId_bookId: {
          storeId: store.id,
          bookId: book.id,
        },
      },
      update: {
        stock: 6 + (i % 16),
        lowStockThreshold: 3 + (i % 3),
      },
      create: {
        storeId: store.id,
        bookId: book.id,
        stock: 6 + (i % 16),
        lowStockThreshold: 3 + (i % 3),
        createdAt: daysAgo(25 - i),
        updatedAt: daysAgo(2 + (i % 4)),
      },
    });
  }

  // Warehouse -> Warehouse transfers
  const existingWarehouseTransfers = await prisma.warehouseTransfer.count({
    where: { note: { contains: MARKER } },
  });
  if (existingWarehouseTransfers < 15) {
    const needed = 15 - existingWarehouseTransfers;
    for (let i = 0; i < needed; i += 1) {
      const fromWarehouse = randomFrom(warehouses, i);
      const toWarehouse = randomFrom(warehouses, i + 1);
      if (fromWarehouse.id === toWarehouse.id) continue;
      const book = randomFrom(books, i + 3);
      await prisma.warehouseTransfer.create({
        data: {
          bookId: book.id,
          fromWarehouseId: fromWarehouse.id,
          toWarehouseId: toWarehouse.id,
          quantity: 2 + (i % 7),
          note: `${MARKER} warehouse rebalance transfer`,
          createdByUserId: adminOrSuper.id,
          createdAt: daysAgo(14 - i, 12),
        },
      });
    }
  }

  // Warehouse -> Store transfers
  const existingStoreTransfers = await prisma.storeTransfer.count({
    where: { note: { contains: MARKER } },
  });
  if (existingStoreTransfers < 18) {
    const needed = 18 - existingStoreTransfers;
    for (let i = 0; i < needed; i += 1) {
      const fromWarehouse = randomFrom(warehouses, i);
      const toStore = randomFrom(stores, i + 1);
      const book = randomFrom(books, i + 2);
      await prisma.storeTransfer.create({
        data: {
          bookId: book.id,
          fromWarehouseId: fromWarehouse.id,
          toStoreId: toStore.id,
          quantity: 1 + (i % 9),
          note: `${MARKER} replenish retail store`,
          createdByUserId: adminOrSuper.id,
          createdAt: daysAgo(10 - i, 11),
        },
      });
    }
  }

  // Purchase orders + items
  const existingPurchaseOrders = await prisma.purchaseOrder.count({
    where: { notes: { contains: MARKER } },
  });
  if (existingPurchaseOrders < 12) {
    const needed = 12 - existingPurchaseOrders;
    for (let i = 0; i < needed; i += 1) {
      const vendor = randomFrom(vendors, i);
      const warehouse = randomFrom(warehouses, i);
      const firstBook = randomFrom(books, i + 4);
      const secondBook = randomFrom(books, i + 11);

      const firstQty = 8 + (i % 6);
      const secondQty = 4 + (i % 5);
      const firstCost = Number(firstBook.price) || 12;
      const secondCost = Number(secondBook.price) || 9;
      const totalCost = firstQty * firstCost + secondQty * secondCost;

      await prisma.purchaseOrder.create({
        data: {
          vendorId: vendor.id,
          warehouseId: warehouse.id,
          status: i % 3 === 0 ? 'CLOSED' : i % 2 === 0 ? 'SENT' : 'RECEIVED',
          createdByUserId: adminOrSuper.id,
          approvedByUserId: adminOrSuper.id,
          expectedAt: daysAgo(-(i % 5) + 2, 15),
          sentAt: daysAgo(8 - i, 10),
          receivedAt: i % 3 === 0 || i % 2 === 1 ? daysAgo(4 - i, 16) : null,
          notes: `${MARKER} procurement transaction batch`,
          totalCost,
          createdAt: daysAgo(9 - i, 9),
          updatedAt: daysAgo(2, 12),
          items: {
            create: [
              {
                bookId: firstBook.id,
                orderedQuantity: firstQty,
                receivedQuantity: i % 3 === 0 || i % 2 === 1 ? firstQty : 0,
                unitCost: firstCost,
              },
              {
                bookId: secondBook.id,
                orderedQuantity: secondQty,
                receivedQuantity: i % 3 === 0 || i % 2 === 1 ? secondQty : 0,
                unitCost: secondCost,
              },
            ],
          },
        },
      });
    }
  }

  // Customer sales transactions (orders + items)
  const existingOrders = await prisma.order.count({
    where: { shippingAddress: { contains: MARKER } },
  });
  if (existingOrders < 20) {
    const needed = 20 - existingOrders;
    for (let i = 0; i < needed; i += 1) {
      const user = randomFrom(orderUsers, i);
      const store = randomFrom(stores, i);
      const lineA = randomFrom(books, i + 1);
      const lineB = randomFrom(books, i + 7);
      const qtyA = 1 + (i % 2);
      const qtyB = 1;
      const formatA = lineA.isDigital && i % 3 === 0 ? 'EBOOK' : 'PHYSICAL';
      const formatB = lineB.isDigital && i % 4 === 0 ? 'EBOOK' : 'PHYSICAL';
      const subtotal =
        qtyA * (formatA === 'EBOOK' ? Number(lineA.ebookPrice ?? lineA.price) : Number(lineA.price)) +
        qtyB * (formatB === 'EBOOK' ? Number(lineB.ebookPrice ?? lineB.price) : Number(lineB.price));
      const discount = i % 5 === 0 ? 2 : 0;
      const total = Math.max(1, subtotal - discount);

      const createdOrder = await prisma.order.create({
        data: {
          userId: user.id,
          status: i % 6 === 0 ? 'PENDING' : i % 4 === 0 ? 'COMPLETED' : 'CONFIRMED',
          deliveryType: i % 3 === 0 ? 'STORE_PICKUP' : 'HOME_DELIVERY',
          storeId: i % 3 === 0 ? store.id : null,
          subtotalPrice: subtotal,
          discountAmount: discount,
          promoCode: discount ? 'OPS2OFF' : null,
          totalPrice: total,
          shippingFullName: `${MARKER} ${user.name}`,
          shippingEmail: user.email,
          shippingPhone: '+1-555-200-1000',
          shippingAddress: `${MARKER} ${150 + i} Testing Ave`,
          shippingCity: i % 2 === 0 ? 'San Francisco' : 'New York',
          shippingState: i % 2 === 0 ? 'CA' : 'NY',
          shippingZipCode: `90${String(100 + i).slice(-3)}`,
          shippingCountry: 'USA',
          paymentProvider: i % 2 === 0 ? 'STRIPE' : 'KPAY',
          paymentReceiptUrl: `https://example.local/receipts/${MARKER}-order-${i + 1}.png`,
          createdAt: daysAgo(12 - i, 11),
          updatedAt: daysAgo(1, 11),
          orderItems: {
            create: [
              {
                bookId: lineA.id,
                quantity: qtyA,
                format: formatA,
                price:
                  formatA === 'EBOOK'
                    ? Number(lineA.ebookPrice ?? lineA.price)
                    : Number(lineA.price),
              },
              {
                bookId: lineB.id,
                quantity: qtyB,
                format: formatB,
                price:
                  formatB === 'EBOOK'
                    ? Number(lineB.ebookPrice ?? lineB.price)
                    : Number(lineB.price),
              },
            ],
          },
        },
        include: { orderItems: true },
      });

      // If eBook order is confirmed/completed, mirror access + reading list.
      if (createdOrder.status === 'CONFIRMED' || createdOrder.status === 'COMPLETED') {
        for (const item of createdOrder.orderItems) {
          if (item.format !== 'EBOOK') continue;
          await prisma.userBookAccess.upsert({
            where: {
              userId_bookId: {
                userId: user.id,
                bookId: item.bookId,
              },
            },
            update: {
              sourceOrderId: createdOrder.id,
            },
            create: {
              userId: user.id,
              bookId: item.bookId,
              sourceOrderId: createdOrder.id,
            },
          });
          await prisma.readingItem.upsert({
            where: {
              userId_bookId: {
                userId: user.id,
                bookId: item.bookId,
              },
            },
            update: {},
            create: {
              userId: user.id,
              bookId: item.bookId,
              status: 'TO_READ',
              currentPage: 0,
            },
          });
        }
      }
    }
  }

  console.log('✅ Ops test seed complete.');
  console.log('   - Marker:', MARKER);
  console.log(`   - Warehouses ensured: ${warehouses.length}`);
  console.log(`   - Stores ensured: ${stores.length}`);
  console.log(`   - Vendors ensured: ${vendors.length}`);
  console.log('   - Added/ensured warehouse & store stocks, transfers, purchase orders, and customer orders');
}

main()
  .catch((error) => {
    console.error('❌ Ops test seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
