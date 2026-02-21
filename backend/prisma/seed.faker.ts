import 'dotenv/config';
import {
  BlogPostStatus,
  ContactType,
  InquiryPriority,
  InquiryStatus,
  InquiryType,
  NotificationType,
  OrderStatus,
  PrismaClient,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  ReadingStatus,
  Role,
  StaffStatus,
  StaffTaskPriority,
  StaffTaskStatus,
  WarehouseAlertStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const FAKER_MARKER = '[FAKER]';

const daysAgo = (days: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const randomFrom = <T>(arr: T[], indexSeed: number): T => arr[indexSeed % arr.length];

const coverFromIsbn = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

const longBlogContent = (topic: string, emphasis: string) =>
  [
    `This article explores ${topic.toLowerCase()} in a practical way. The goal is to provide a repeatable system your team can use every week.`,
    `Primary emphasis: ${emphasis}. Instead of abstract tips, this write-up focuses on workflows, constraints, and measurable outcomes.`,
    'Section 1: Define scope and expected outcome before execution.\nSection 2: Capture edge cases early.\nSection 3: Review results and feed them into the next cycle.',
    'One recurring mistake is over-optimizing one metric while ignoring system stability. Balanced operations come from visibility, clear ownership, and controlled hand-offs.',
    'Use this as a baseline template, then adjust thresholds to your actual volume and team capacity.',
  ].join('\n\n');

async function ensureUser(
  email: string,
  name: string,
  passwordHash: string,
  role: Role = Role.USER,
  profile?: Partial<{
    pronouns: string;
    shortBio: string;
    about: string;
    coverImage: string;
    avatarType: string;
    avatarValue: string;
    backgroundColor: string;
  }>,
) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      ...(profile ?? {}),
    },
    create: {
      email,
      name,
      password: passwordHash,
      role,
      ...(profile ?? {}),
    },
  });
}

async function ensureCoreUsers() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);
  const authorHash = await bcrypt.hash('author123', 10);

  const admin = await ensureUser('admin@bookstore.com', 'Admin User', adminHash, Role.ADMIN, {
    shortBio: 'Platform administrator for Treasure House.',
  });

  const superAdmin = await ensureUser('super.admin@bookstore.com', 'Executive Admin', adminHash, Role.SUPER_ADMIN, {
    shortBio: 'Super admin account for system-level governance.',
  });

  const customersSeed = [
    { email: 'john.doe@example.com', name: 'John Doe' },
    { email: 'jane.smith@example.com', name: 'Jane Smith' },
    { email: 'bob.wilson@example.com', name: 'Bob Wilson' },
    { email: 'alice.johnson@example.com', name: 'Alice Johnson' },
    { email: 'michael.brown@example.com', name: 'Michael Brown' },
    { email: 'sarah.davis@example.com', name: 'Sarah Davis' },
    { email: 'david.miller@example.com', name: 'David Miller' },
    { email: 'emily.wilson@example.com', name: 'Emily Wilson' },
    { email: 'christopher.moore@example.com', name: 'Christopher Moore' },
    { email: 'jessica.taylor@example.com', name: 'Jessica Taylor' },
    { email: 'amanda.white@example.com', name: 'Amanda White' },
    { email: 'kevin.lewis@example.com', name: 'Kevin Lewis' },
  ];

  for (let i = 0; i < 28; i += 1) {
    customersSeed.push({
      email: `customer.${String(i + 1).padStart(2, '0')}@faker.local`,
      name: `Customer ${String(i + 1).padStart(2, '0')}`,
    });
  }

  const customers = [];
  for (const customer of customersSeed) {
    customers.push(
      await ensureUser(customer.email, customer.name, userHash, Role.USER, {
        shortBio: 'Book lover and active community reader.',
        pronouns: 'they/them',
      }),
    );
  }

  const staffSeed = [
    { email: 'hr.michael@example.com', name: 'Michael Brown', dept: 'HR', title: 'HR Manager' },
    { email: 'hr.ella@example.com', name: 'Ella Ford', dept: 'HR', title: 'HR Coordinator' },
    { email: 'cs.iris@example.com', name: 'Iris Cole', dept: 'CS', title: 'Support Agent' },
    { email: 'cs.noah@example.com', name: 'Noah Price', dept: 'CS', title: 'Senior Support Agent' },
    { email: 'stock.jane@example.com', name: 'Jane Smith', dept: 'STOCK', title: 'Warehouse Supervisor' },
    { email: 'stock.sarah@example.com', name: 'Sarah Davis', dept: 'STOCK', title: 'Inventory Controller' },
    { email: 'fin.ronan@example.com', name: 'Ronan Blake', dept: 'FIN', title: 'Finance Approver' },
    { email: 'fin.nina@example.com', name: 'Nina Hart', dept: 'FIN', title: 'Finance Analyst' },
    { email: 'mkt.maya@example.com', name: 'Maya Quinn', dept: 'MKT', title: 'Marketing Manager' },
    { email: 'mkt.owen@example.com', name: 'Owen Reed', dept: 'MKT', title: 'Campaign Specialist' },
    { email: 'legal.kai@example.com', name: 'Kai Monroe', dept: 'LEGAL', title: 'Legal Associate' },
    { email: 'legal.lena@example.com', name: 'Lena Park', dept: 'LEGAL', title: 'Compliance Specialist' },
  ];

  const staffUsers = [];
  for (const staff of staffSeed) {
    staffUsers.push(
      await ensureUser(staff.email, staff.name, staffHash, Role.USER, {
        shortBio: `${staff.title} at Treasure House`,
      }),
    );
  }

  const authorSeed = [
    {
      email: 'author.nora@example.com',
      name: 'Nora Everly',
      pronouns: 'she/her',
      shortBio: 'Writes about reading workflows and editorial systems.',
      about:
        'Nora focuses on practical reading systems for modern teams and independent readers. Her writing explores editorial workflow design and long-term knowledge retention.',
      coverImage:
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    },
    {
      email: 'author.julian@example.com',
      name: 'Julian Vale',
      pronouns: 'he/him',
      shortBio: 'Technology writer and systems thinker.',
      about:
        'Julian writes about software, operations, and applied learning. He is interested in how teams turn ideas into reliable systems.',
      coverImage:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=80',
    },
    {
      email: 'author.samira@example.com',
      name: 'Samira Kline',
      pronouns: 'she/her',
      shortBio: 'Curates book recommendations for builders and creators.',
      about:
        'Samira blends narrative writing with practical strategy. Her work highlights books and frameworks that improve execution and critical thinking.',
      coverImage:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1600&q=80',
    },
    {
      email: 'author.owen@example.com',
      name: 'Owen Hart',
      pronouns: 'he/him',
      shortBio: 'Explores productivity, publishing, and reading behavior.',
      about:
        'Owen writes long-form essays on publishing quality and operational discipline for creative and technical teams.',
      coverImage:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1600&q=80',
    },
    {
      email: 'author.rhea@example.com',
      name: 'Rhea Stone',
      pronouns: 'they/them',
      shortBio: 'Investigates habit design and learning systems.',
      about:
        'Rhea specializes in habit architecture and the psychology of consistent progress. They turn dense ideas into actionable routines.',
      coverImage:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=80',
    },
    {
      email: 'author.milo@example.com',
      name: 'Milo Reeves',
      pronouns: 'he/him',
      shortBio: 'Writes on product craft, feedback loops, and clarity.',
      about:
        'Milo has led product and operations initiatives in publishing and software. His essays focus on decision quality under uncertainty.',
      coverImage:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1600&q=80',
    },
  ];

  const authors = [];
  for (const author of authorSeed) {
    authors.push(
      await ensureUser(author.email, author.name, authorHash, Role.USER, {
        pronouns: author.pronouns,
        shortBio: author.shortBio,
        about: author.about,
        coverImage: author.coverImage,
      }),
    );
  }

  return {
    admin,
    superAdmin,
    customers,
    staffUsers,
    staffSeed,
    authors,
  };
}

async function ensureDepartmentsAndStaff(staffUsers: Awaited<ReturnType<typeof ensureCoreUsers>>['staffUsers'], staffSeed: Awaited<ReturnType<typeof ensureCoreUsers>>['staffSeed']) {
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: 'HR' },
      update: { name: 'HR', description: 'Human resources and people operations.' },
      create: {
        code: 'HR',
        name: 'HR',
        description: 'Human resources and people operations.',
      },
    }),
    prisma.department.upsert({
      where: { code: 'CS' },
      update: { name: 'Customer Service', description: 'Customer support and inquiry handling.' },
      create: {
        code: 'CS',
        name: 'Customer Service',
        description: 'Customer support and inquiry handling.',
      },
    }),
    prisma.department.upsert({
      where: { code: 'STOCK' },
      update: { name: 'Stock Management', description: 'Warehouse and inventory operations.' },
      create: {
        code: 'STOCK',
        name: 'Stock Management',
        description: 'Warehouse and inventory operations.',
      },
    }),
    prisma.department.upsert({
      where: { code: 'FIN' },
      update: { name: 'Finance', description: 'Payments, approvals, and transaction auditing.' },
      create: {
        code: 'FIN',
        name: 'Finance',
        description: 'Payments, approvals, and transaction auditing.',
      },
    }),
    prisma.department.upsert({
      where: { code: 'LEGAL' },
      update: { name: 'Legal', description: 'Compliance, legal review, and policy support.' },
      create: {
        code: 'LEGAL',
        name: 'Legal',
        description: 'Compliance, legal review, and policy support.',
      },
    }),
    prisma.department.upsert({
      where: { code: 'MKT' },
      update: { name: 'Marketing', description: 'Campaigns and sponsored promotions.' },
      create: {
        code: 'MKT',
        name: 'Marketing',
        description: 'Campaigns and sponsored promotions.',
      },
    }),
  ]);

  const departmentByCode = new Map(departments.map((department) => [department.code, department]));

  const permissionKeys = [
    'staff.view',
    'staff.manage',
    'hr.staff.create',
    'hr.staff.update',
    'hr.performance.manage',
    'support.inquiries.view',
    'support.inquiries.reply',
    'support.inquiries.assign',
    'support.inquiries.escalate',
    'support.messages.view',
    'support.messages.reply',
    'support.messages.resolve',
    'warehouse.view',
    'warehouse.stock.update',
    'warehouse.transfer',
    'warehouse.purchase_request.create',
    'warehouse.purchase_request.view',
    'warehouse.purchase_request.complete',
    'warehouse.purchase_order.view',
    'warehouse.purchase_order.create',
    'warehouse.purchase_order.receive',
    'warehouse.vendor.manage',
    'finance.reports.view',
    'finance.refund.approve',
    'finance.payout.manage',
    'finance.purchase_request.review',
    'finance.purchase_request.approve',
    'finance.purchase_request.reject',
    'finance.purchase_order.view',
    'finance.inquiries.view',
    'finance.inquiries.reply',
    'finance.inquiries.manage',
    'marketing.inquiries.view',
    'marketing.inquiries.reply',
    'marketing.inquiries.manage',
    'department.inquiries.view',
    'department.inquiries.reply',
    'inquiries.create',
    'inquiries.view',
  ];

  const permissions = await Promise.all(
    permissionKeys.map((key) =>
      prisma.staffPermission.upsert({
        where: { key },
        update: {},
        create: { key },
      }),
    ),
  );

  const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission]));

  const roleSpecs = [
    {
      code: 'HR_MANAGER',
      name: 'HR Manager',
      departmentCode: 'HR',
      permissions: ['staff.view', 'staff.manage', 'hr.staff.create', 'hr.staff.update', 'hr.performance.manage'],
    },
    {
      code: 'CS_SUPPORT_AGENT',
      name: 'Support Agent',
      departmentCode: 'CS',
      permissions: [
        'support.inquiries.view',
        'support.inquiries.reply',
        'support.inquiries.assign',
        'support.inquiries.escalate',
        'support.messages.view',
        'support.messages.reply',
      ],
    },
    {
      code: 'STOCK_WAREHOUSE_SUPERVISOR',
      name: 'Warehouse Supervisor',
      departmentCode: 'STOCK',
      permissions: [
        'warehouse.view',
        'warehouse.stock.update',
        'warehouse.transfer',
        'warehouse.purchase_request.create',
        'warehouse.purchase_request.view',
        'warehouse.purchase_request.complete',
        'warehouse.purchase_order.view',
        'warehouse.purchase_order.create',
        'warehouse.purchase_order.receive',
      ],
    },
    {
      code: 'FIN_FINANCE_APPROVER',
      name: 'Finance Approver',
      departmentCode: 'FIN',
      permissions: [
        'finance.reports.view',
        'finance.refund.approve',
        'finance.payout.manage',
        'finance.purchase_request.review',
        'finance.purchase_request.approve',
        'finance.purchase_request.reject',
        'finance.purchase_order.view',
        'finance.inquiries.view',
        'finance.inquiries.reply',
      ],
    },
    {
      code: 'LEGAL_COMPLIANCE_OFFICER',
      name: 'Compliance Officer',
      departmentCode: 'LEGAL',
      permissions: ['department.inquiries.view', 'department.inquiries.reply', 'inquiries.view'],
    },
    {
      code: 'MKT_MARKETING_MANAGER',
      name: 'Marketing Manager',
      departmentCode: 'MKT',
      permissions: ['marketing.inquiries.view', 'marketing.inquiries.reply', 'marketing.inquiries.manage'],
    },
  ];

  const roleByCode = new Map<string, Awaited<ReturnType<typeof prisma.staffRole.upsert>>>();

  for (const role of roleSpecs) {
    const department = departmentByCode.get(role.departmentCode);
    if (!department) continue;
    const persisted = await prisma.staffRole.upsert({
      where: {
        name_departmentId: {
          name: role.name,
          departmentId: department.id,
        },
      },
      update: {
        code: role.code,
      },
      create: {
        code: role.code,
        name: role.name,
        departmentId: department.id,
        isSystem: true,
      },
    });

    roleByCode.set(role.code, persisted);

    await prisma.staffRolePermission.deleteMany({ where: { roleId: persisted.id } });
    for (const permissionKey of role.permissions) {
      const permission = permissionByKey.get(permissionKey);
      if (!permission) continue;
      await prisma.staffRolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: persisted.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: persisted.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const staffProfileEntries: Array<{
    staffEmail: string;
    employeeCode: string;
    roleCode: string;
    title: string;
    departmentCode: string;
  }> = staffSeed.map((staff, index) => ({
    staffEmail: staff.email,
    employeeCode: `EMP-${4000 + index}`,
    roleCode:
      staff.dept === 'HR'
        ? 'HR_MANAGER'
        : staff.dept === 'CS'
          ? 'CS_SUPPORT_AGENT'
          : staff.dept === 'STOCK'
            ? 'STOCK_WAREHOUSE_SUPERVISOR'
            : staff.dept === 'FIN'
              ? 'FIN_FINANCE_APPROVER'
              : staff.dept === 'MKT'
                ? 'MKT_MARKETING_MANAGER'
              : 'LEGAL_COMPLIANCE_OFFICER',
    title: staff.title,
    departmentCode: staff.dept,
  }));

  const staffProfileByUserId = new Map<string, Awaited<ReturnType<typeof prisma.staffProfile.upsert>>>();

  for (const item of staffProfileEntries) {
    const user = staffUsers.find((staff) => staff.email === item.staffEmail);
    const department = departmentByCode.get(item.departmentCode);
    const role = roleByCode.get(item.roleCode);
    if (!user || !department || !role) continue;

    const profile = await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {
        departmentId: department.id,
        title: item.title,
        status: StaffStatus.ACTIVE,
      },
      create: {
        userId: user.id,
        departmentId: department.id,
        employeeCode: item.employeeCode,
        title: item.title,
        status: StaffStatus.ACTIVE,
      },
    });

    staffProfileByUserId.set(user.id, profile);

    const assignment = await prisma.staffAssignment.findFirst({
      where: {
        staffId: profile.id,
        roleId: role.id,
        effectiveTo: null,
      },
      select: { id: true },
    });

    if (!assignment) {
      await prisma.staffAssignment.create({
        data: {
          staffId: profile.id,
          roleId: role.id,
          effectiveFrom: daysAgo(90 + Math.floor(Math.random() * 120)),
        },
      });
    }
  }

  return {
    departments,
    departmentByCode,
    roleByCode,
    staffProfileByUserId,
  };
}

async function ensureBooks() {
  const baseBooks = [
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', price: 12.99, categories: ['Fiction', 'Classic'], genres: ['Classic'] },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', price: 14.99, categories: ['Fiction', 'Classic'], genres: ['Classic'] },
    { title: '1984', author: 'George Orwell', isbn: '9780452284234', price: 13.99, categories: ['Fiction', 'Dystopian'], genres: ['Dystopian'] },
    { title: 'Dune', author: 'Frank Herbert', isbn: '9780441172719', price: 16.99, categories: ['Science Fiction', 'Fantasy'], genres: ['Science Fiction'] },
    { title: 'The Hobbit', author: 'J.R.R. Tolkien', isbn: '9780547928227', price: 16.99, categories: ['Fantasy'], genres: ['Fantasy'] },
    { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', price: 42.99, categories: ['Programming', 'Technology'], genres: ['Software'] },
    { title: 'Design Patterns', author: 'Gang of Four', isbn: '9780201633610', price: 54.99, categories: ['Programming', 'Technology'], genres: ['Software'] },
    { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780201616224', price: 39.99, categories: ['Programming', 'Technology'], genres: ['Software'] },
    { title: "You Don't Know JS", author: 'Kyle Simpson', isbn: '9781491950191', price: 34.99, categories: ['Programming', 'Technology'], genres: ['JavaScript'] },
    { title: 'Atomic Habits', author: 'James Clear', isbn: '9780735211292', price: 16.99, categories: ['Self-Help', 'Business'], genres: ['Self-Help'] },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '9780374533557', price: 18.99, categories: ['Psychology', 'Business'], genres: ['Behavioral Science'] },
    { title: 'The Silent Patient', author: 'Alex Michaelides', isbn: '9781250301697', price: 15.99, categories: ['Mystery', 'Thriller'], genres: ['Psychological Thriller'] },
    { title: 'Gone Girl', author: 'Gillian Flynn', isbn: '9780307588364', price: 15.99, categories: ['Mystery', 'Thriller'], genres: ['Thriller'] },
    { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', price: 17.99, categories: ['Science', 'Nonfiction'], genres: ['Physics'] },
    { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9780062316097', price: 18.99, categories: ['History', 'Nonfiction'], genres: ['History'] },
  ];

  for (const book of baseBooks) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {
        title: book.title,
        author: book.author,
        price: book.price,
        categories: book.categories,
        genres: book.genres,
      },
      create: {
        ...book,
        stock: 0,
        description: `${book.title} by ${book.author}. ${FAKER_MARKER} catalog seed`,
        coverImage: coverFromIsbn(book.isbn),
        rating: 0,
      },
    });
  }

  const existingBookCount = await prisma.book.count();
  const target = 90;
  const createCount = Math.max(0, target - existingBookCount);

  if (createCount > 0) {
    for (let i = 0; i < createCount; i += 1) {
      const n = existingBookCount + i + 1;
      const isbn = `979000${String(1000000 + n).slice(-7)}${String((n % 9) + 1)}`;
      await prisma.book.upsert({
        where: { isbn },
        update: {},
        create: {
          title: `Curated Reading Volume ${n}`,
          author: `Editorial Team ${((n - 1) % 7) + 1}`,
          isbn,
          price: 9.99 + (n % 30),
          stock: 0,
          description: `${FAKER_MARKER} synthetic catalog title for UI testing.`,
          coverImage: coverFromIsbn(isbn),
          categories: n % 2 === 0 ? ['Fiction', 'Contemporary'] : ['Technology', 'Productivity'],
          genres: n % 2 === 0 ? ['Literary'] : ['Practical'],
          rating: 0,
        },
      });
    }
  }

  return prisma.book.findMany({
    orderBy: [{ title: 'asc' }],
  });
}

async function ensureWarehousesAndDistribution(books: Awaited<ReturnType<typeof ensureBooks>>) {
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { code: 'WH-SFO-01' },
      update: { name: 'Bay Area Central Warehouse', city: 'San Francisco', state: 'CA', isActive: true },
      create: {
        code: 'WH-SFO-01',
        name: 'Bay Area Central Warehouse',
        city: 'San Francisco',
        state: 'CA',
        address: '200 Harbor Way, San Francisco, CA',
        isActive: true,
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'WH-NYC-01' },
      update: { name: 'Northeast Fulfillment Hub', city: 'New York', state: 'NY', isActive: true },
      create: {
        code: 'WH-NYC-01',
        name: 'Northeast Fulfillment Hub',
        city: 'New York',
        state: 'NY',
        address: '85 Liberty Ave, New York, NY',
        isActive: true,
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'WH-TX-01' },
      update: { name: 'Southwest Distribution Center', city: 'Austin', state: 'TX', isActive: true },
      create: {
        code: 'WH-TX-01',
        name: 'Southwest Distribution Center',
        city: 'Austin',
        state: 'TX',
        address: '410 Industrial Dr, Austin, TX',
        isActive: true,
      },
    }),
    prisma.warehouse.upsert({
      where: { code: 'WH-SEA-01' },
      update: { name: 'Northwest Overflow Storage', city: 'Seattle', state: 'WA', isActive: false },
      create: {
        code: 'WH-SEA-01',
        name: 'Northwest Overflow Storage',
        city: 'Seattle',
        state: 'WA',
        address: '19 Rainier Park, Seattle, WA',
        isActive: false,
      },
    }),
  ]);

  const workingBooks = books.slice(0, 75);

  for (let i = 0; i < workingBooks.length; i += 1) {
    const book = workingBooks[i];
    for (let w = 0; w < warehouses.length; w += 1) {
      const warehouse = warehouses[w];
      const shouldHaveRow = (i + w) % 2 === 0 || i % 5 === w % 5;
      if (!shouldHaveRow) continue;

      const baseline = ((i + 3) * (w + 2)) % 28;
      const stock = i % 14 === w ? 0 : i % 9 === w ? 2 : baseline + 1;
      const threshold = 4 + ((i + w) % 4);

      await prisma.warehouseStock.upsert({
        where: {
          warehouseId_bookId: {
            warehouseId: warehouse.id,
            bookId: book.id,
          },
        },
        update: {
          stock,
          lowStockThreshold: threshold,
        },
        create: {
          warehouseId: warehouse.id,
          bookId: book.id,
          stock,
          lowStockThreshold: threshold,
        },
      });
    }
  }

  const allStocks = await prisma.warehouseStock.findMany({
    where: { bookId: { in: workingBooks.map((book) => book.id) } },
    select: { bookId: true, stock: true },
  });

  const stockByBook = new Map<string, number>();
  for (const row of allStocks) {
    stockByBook.set(row.bookId, (stockByBook.get(row.bookId) ?? 0) + row.stock);
  }

  for (const book of workingBooks) {
    await prisma.book.update({
      where: { id: book.id },
      data: { stock: stockByBook.get(book.id) ?? 0 },
    });
  }

  const stockRows = await prisma.warehouseStock.findMany({
    include: {
      warehouse: { select: { id: true } },
      book: { select: { id: true } },
    },
  });

  for (const row of stockRows) {
    if (row.stock <= row.lowStockThreshold) {
      const existingOpen = await prisma.warehouseAlert.findFirst({
        where: {
          warehouseId: row.warehouseId,
          bookId: row.bookId,
          status: WarehouseAlertStatus.OPEN,
        },
        select: { id: true },
      });

      if (!existingOpen) {
        await prisma.warehouseAlert.create({
          data: {
            warehouseId: row.warehouseId,
            bookId: row.bookId,
            stock: row.stock,
            threshold: row.lowStockThreshold,
            status: WarehouseAlertStatus.OPEN,
          },
        });
      }
    } else {
      await prisma.warehouseAlert.updateMany({
        where: {
          warehouseId: row.warehouseId,
          bookId: row.bookId,
          status: WarehouseAlertStatus.OPEN,
        },
        data: {
          status: WarehouseAlertStatus.RESOLVED,
          resolvedAt: new Date(),
        },
      });
    }
  }

  return warehouses;
}

async function ensureOrdersAndLibrary(customers: Awaited<ReturnType<typeof ensureCoreUsers>>['customers'], books: Awaited<ReturnType<typeof ensureBooks>>) {
  const candidates = books.filter((book) => Number(book.price) > 0).slice(0, 60);
  const targetOrders = 65;

  const existingFakerOrders = await prisma.order.count({
    where: {
      shippingEmail: { endsWith: '@faker.local' },
    },
  });

  const toCreate = Math.max(0, targetOrders - existingFakerOrders);

  for (let i = 0; i < toCreate; i += 1) {
    const customer = randomFrom(customers, i);
    const status = randomFrom(
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      i,
    );
    const itemCount = (i % 3) + 1;

    const selectedBooks = Array.from({ length: itemCount }).map((_, itemIdx) =>
      randomFrom(candidates, i * 3 + itemIdx),
    );

    const itemData = selectedBooks.map((book, itemIdx) => {
      const quantity = (itemIdx % 2) + 1;
      return {
        bookId: book.id,
        quantity,
        price: Number(book.price),
      };
    });

    const total = itemData.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await prisma.order.create({
      data: {
        userId: customer.id,
        status,
        subtotalPrice: Number(total.toFixed(2)),
        discountAmount: 0,
        totalPrice: Number(total.toFixed(2)),
        shippingFullName: customer.name,
        shippingEmail: `${customer.name.toLowerCase().replace(/\s+/g, '.')}@faker.local`,
        shippingPhone: `+1-555-${String(1000 + (i % 8999)).padStart(4, '0')}`,
        shippingAddress: `${100 + i} Market Street`,
        shippingCity: randomFrom(['San Francisco', 'New York', 'Austin', 'Seattle', 'Chicago'], i),
        shippingState: randomFrom(['CA', 'NY', 'TX', 'WA', 'IL'], i),
        shippingZipCode: String(10000 + (i % 89999)),
        shippingCountry: 'USA',
        paymentProvider: randomFrom(['KPay', 'WavePay', 'MPU Transfer', 'Visa'], i),
        paymentReceiptUrl: status === OrderStatus.PENDING ? null : `https://receipts.example.com/${FAKER_MARKER.replace(/[^A-Z]/g, '')}/${Date.now()}_${i}.jpg`,
        createdAt: daysAgo((i % 45) + 1, 9 + (i % 8)),
        orderItems: {
          create: itemData,
        },
      },
    });
  }

  for (let i = 0; i < customers.length; i += 1) {
    const user = customers[i];
    const toReadBook = randomFrom(candidates, i * 2);
    const readingBook = randomFrom(candidates, i * 2 + 1);
    const finishedBook = randomFrom(candidates, i * 2 + 2);

    await prisma.readingItem.upsert({
      where: { userId_bookId: { userId: user.id, bookId: toReadBook.id } },
      update: { status: ReadingStatus.TO_READ, currentPage: 0 },
      create: {
        userId: user.id,
        bookId: toReadBook.id,
        status: ReadingStatus.TO_READ,
        currentPage: 0,
        totalPages: 320,
      },
    });

    await prisma.readingItem.upsert({
      where: { userId_bookId: { userId: user.id, bookId: readingBook.id } },
      update: { status: ReadingStatus.READING, currentPage: 75, dailyGoalPages: 20 },
      create: {
        userId: user.id,
        bookId: readingBook.id,
        status: ReadingStatus.READING,
        currentPage: 75,
        totalPages: 420,
        dailyGoalPages: 20,
        startedAt: daysAgo((i % 10) + 2),
      },
    });

    await prisma.readingItem.upsert({
      where: { userId_bookId: { userId: user.id, bookId: finishedBook.id } },
      update: { status: ReadingStatus.FINISHED, currentPage: 380 },
      create: {
        userId: user.id,
        bookId: finishedBook.id,
        status: ReadingStatus.FINISHED,
        currentPage: 380,
        totalPages: 380,
        startedAt: daysAgo((i % 30) + 20),
        finishedAt: daysAgo(i % 10),
      },
    });

    await prisma.wishlistItem.upsert({
      where: { userId_bookId: { userId: user.id, bookId: toReadBook.id } },
      update: {},
      create: { userId: user.id, bookId: toReadBook.id },
    });

    await prisma.favoriteItem.upsert({
      where: { userId_bookId: { userId: user.id, bookId: finishedBook.id } },
      update: {},
      create: { userId: user.id, bookId: finishedBook.id },
    });

    const existingReview = await prisma.review.findFirst({
      where: { userId: user.id, bookId: finishedBook.id },
      select: { id: true },
    });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          userId: user.id,
          bookId: finishedBook.id,
          rating: (i % 5) + 1,
          comment: `${FAKER_MARKER} Review from ${user.name}: helpful read with practical insights.`,
          createdAt: daysAgo((i % 15) + 1),
        },
      });
    }
  }

  return {
    ordersCreated: toCreate,
  };
}

async function ensureVendorsAndProcurement(
  books: Awaited<ReturnType<typeof ensureBooks>>,
  warehouses: Awaited<ReturnType<typeof ensureWarehousesAndDistribution>>,
  staffProfileByUserId: Map<string, Awaited<ReturnType<typeof prisma.staffProfile.upsert>>>,
  staffUsers: Awaited<ReturnType<typeof ensureCoreUsers>>['staffUsers'],
) {
  const vendors = await Promise.all([
    prisma.vendor.upsert({
      where: { code: 'HARPERCOLLINS' },
      update: { isActive: true },
      create: {
        code: 'HARPERCOLLINS',
        name: 'HarperCollins Wholesale',
        contactName: 'Wholesale Desk',
        email: 'wholesale@harpercollins.example',
        phone: '+1-646-555-0123',
        address: '195 Broadway, New York, NY',
        isActive: true,
      },
    }),
    prisma.vendor.upsert({
      where: { code: 'PENGUIN-RH' },
      update: { isActive: true },
      create: {
        code: 'PENGUIN-RH',
        name: 'Penguin Random House Distribution',
        contactName: 'B2B Supply Team',
        email: 'supply@penguinrh.example',
        phone: '+1-212-555-0190',
        address: '1745 Broadway, New York, NY',
        isActive: true,
      },
    }),
    prisma.vendor.upsert({
      where: { code: 'SIMON-SCHUSTER' },
      update: { isActive: true },
      create: {
        code: 'SIMON-SCHUSTER',
        name: 'Simon & Schuster Trade Supply',
        contactName: 'Vendor Operations',
        email: 'ops@simon.example',
        phone: '+1-917-555-0188',
        address: '1230 Avenue of the Americas, New York, NY',
        isActive: true,
      },
    }),
  ]);

  const financeUsers = staffUsers.filter((user) => user.email.startsWith('fin.'));
  const stockUsers = staffUsers.filter((user) => user.email.startsWith('stock.'));

  const requestedBy = stockUsers[0] ?? staffUsers[0];
  const approvedBy = financeUsers[0] ?? staffUsers[0];

  const existingFakerRequests = await prisma.purchaseRequest.count({
    where: { reviewNote: { contains: FAKER_MARKER } },
  });

  const targetRequests = 36;
  const toCreate = Math.max(0, targetRequests - existingFakerRequests);

  const reqStatuses = [
    PurchaseRequestStatus.DRAFT,
    PurchaseRequestStatus.PENDING_APPROVAL,
    PurchaseRequestStatus.APPROVED,
    PurchaseRequestStatus.REJECTED,
    PurchaseRequestStatus.COMPLETED,
  ];

  for (let i = 0; i < toCreate; i += 1) {
    const book = randomFrom(books, i + 3);
    const warehouse = randomFrom(warehouses, i + 2);
    const status = randomFrom(reqStatuses, i);
    const quantity = 10 + (i % 15);
    const estimatedCost = Number((Number(book.price) * quantity).toFixed(2));

    const request = await prisma.purchaseRequest.create({
      data: {
        bookId: book.id,
        warehouseId: warehouse.id,
        requestedByUserId: requestedBy.id,
        quantity,
        estimatedCost,
        status,
        reviewNote:
          status === PurchaseRequestStatus.REJECTED
            ? `${FAKER_MARKER} Rejected for budget balancing.`
            : `${FAKER_MARKER} Generated procurement request for testing.`,
        approvedByUserId:
          status === PurchaseRequestStatus.APPROVED || status === PurchaseRequestStatus.COMPLETED || status === PurchaseRequestStatus.REJECTED
            ? approvedBy.id
            : null,
        approvedQuantity:
          status === PurchaseRequestStatus.APPROVED || status === PurchaseRequestStatus.COMPLETED
            ? quantity - (i % 3)
            : null,
        approvedCost:
          status === PurchaseRequestStatus.APPROVED || status === PurchaseRequestStatus.COMPLETED
            ? Number((estimatedCost * (0.95 + (i % 2) * 0.03)).toFixed(2))
            : null,
        approvedAt:
          status === PurchaseRequestStatus.APPROVED || status === PurchaseRequestStatus.COMPLETED || status === PurchaseRequestStatus.REJECTED
            ? daysAgo((i % 20) + 2)
            : null,
        completedAt: status === PurchaseRequestStatus.COMPLETED ? daysAgo(i % 8) : null,
        createdAt: daysAgo((i % 35) + 5),
      },
    });

    if (status === PurchaseRequestStatus.APPROVED || status === PurchaseRequestStatus.COMPLETED) {
      const vendor = randomFrom(vendors, i);
      const poStatus = status === PurchaseRequestStatus.COMPLETED ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.SENT;
      const approvedQuantity = request.approvedQuantity ?? request.quantity;

      const order = await prisma.purchaseOrder.create({
        data: {
          vendorId: vendor.id,
          warehouseId: request.warehouseId,
          status: poStatus,
          createdByUserId: requestedBy.id,
          approvedByUserId: approvedBy.id,
          expectedAt: daysAgo(-(7 - (i % 5))),
          sentAt: daysAgo((i % 14) + 1),
          receivedAt: status === PurchaseRequestStatus.COMPLETED ? daysAgo(i % 6) : null,
          notes: `${FAKER_MARKER} Purchase order for procurement workflow simulation`,
          totalCost: request.approvedCost ?? request.estimatedCost ?? estimatedCost,
          request: {
            connect: { id: request.id },
          },
          items: {
            create: {
              bookId: request.bookId,
              orderedQuantity: approvedQuantity,
              receivedQuantity: status === PurchaseRequestStatus.COMPLETED ? approvedQuantity : Math.floor(approvedQuantity / 2),
              unitCost: Number(
                (
                  Number(request.approvedCost ?? request.estimatedCost ?? estimatedCost) /
                  Math.max(approvedQuantity, 1)
                ).toFixed(2),
              ),
            },
          },
        },
      });

      await prisma.purchaseRequest.update({
        where: { id: request.id },
        data: {
          purchaseOrderId: order.id,
        },
      });

      if (status === PurchaseRequestStatus.COMPLETED) {
        const existingStock = await prisma.warehouseStock.findUnique({
          where: {
            warehouseId_bookId: {
              warehouseId: request.warehouseId,
              bookId: request.bookId,
            },
          },
        });

        if (existingStock) {
          await prisma.warehouseStock.update({
            where: { id: existingStock.id },
            data: { stock: existingStock.stock + approvedQuantity },
          });
        } else {
          await prisma.warehouseStock.create({
            data: {
              warehouseId: request.warehouseId,
              bookId: request.bookId,
              stock: approvedQuantity,
              lowStockThreshold: 5,
            },
          });
        }
      }
    }
  }

  const transferCount = await prisma.warehouseTransfer.count({
    where: { note: { contains: FAKER_MARKER } },
  });

  if (transferCount < 24) {
    const needed = 24 - transferCount;
    for (let i = 0; i < needed; i += 1) {
      const book = randomFrom(books, i + 9);
      const fromWarehouse = randomFrom(warehouses, i);
      const toWarehouse = randomFrom(warehouses.filter((warehouse) => warehouse.id !== fromWarehouse.id), i + 1);
      await prisma.warehouseTransfer.create({
        data: {
          bookId: book.id,
          fromWarehouseId: fromWarehouse.id,
          toWarehouseId: toWarehouse.id,
          quantity: (i % 8) + 2,
          note: `${FAKER_MARKER} Internal balancing transfer`,
          createdByUserId: stockUsers[0]?.id,
          createdAt: daysAgo((i % 20) + 1),
        },
      });
    }
  }

  const taskCount = await prisma.staffTask.count({
    where: {
      metadata: {
        path: ['source'],
        equals: 'faker-seed',
      },
    },
  });

  if (taskCount < 40) {
    const staffProfiles = Array.from(staffProfileByUserId.values());
    const target = 40 - taskCount;

    for (let i = 0; i < target; i += 1) {
      const assignee = randomFrom(staffProfiles, i);
      await prisma.staffTask.create({
        data: {
          staffId: assignee.id,
          type: randomFrom(
            [
              'Review overdue purchase requests',
              'Process low stock replenishment',
              'Validate vendor delivery batch',
              'Close resolved support inquiries',
              'Audit role assignments',
            ],
            i,
          ),
          status: randomFrom(
            [StaffTaskStatus.TODO, StaffTaskStatus.IN_PROGRESS, StaffTaskStatus.BLOCKED, StaffTaskStatus.COMPLETED],
            i,
          ),
          priority: randomFrom(
            [StaffTaskPriority.LOW, StaffTaskPriority.MEDIUM, StaffTaskPriority.HIGH, StaffTaskPriority.CRITICAL],
            i + 2,
          ),
          metadata: {
            source: 'faker-seed',
            note: `${FAKER_MARKER} staff task`,
            dueInDays: (i % 7) + 1,
          },
          createdAt: daysAgo((i % 12) + 1),
          completedAt: i % 4 === 0 ? daysAgo(i % 5) : null,
        },
      });
    }
  }

  return { vendors };
}

async function ensureInquiriesAndContacts(
  customers: Awaited<ReturnType<typeof ensureCoreUsers>>['customers'],
  departmentsByCode: Map<string, { id: string; code: string }>,
  staffProfileByUserId: Map<string, Awaited<ReturnType<typeof prisma.staffProfile.upsert>>>,
  staffUsers: Awaited<ReturnType<typeof ensureCoreUsers>>['staffUsers'],
) {
  const existingInquiries = await prisma.inquiry.count({
    where: { subject: { startsWith: FAKER_MARKER } },
  });
  const targetInquiries = 32;
  const toCreate = Math.max(0, targetInquiries - existingInquiries);

  const supportDepartment = departmentsByCode.get('CS');
  const financeDepartment = departmentsByCode.get('FIN');
  const legalDepartment = departmentsByCode.get('LEGAL');
  const stockDepartment = departmentsByCode.get('STOCK');

  const supportStaffUser = staffUsers.find((user) => user.email.startsWith('cs.'));
  const financeStaffUser = staffUsers.find((user) => user.email.startsWith('fin.'));
  const legalStaffUser = staffUsers.find((user) => user.email.startsWith('legal.'));
  const stockStaffUser = staffUsers.find((user) => user.email.startsWith('stock.'));

  const supportStaffProfile = supportStaffUser ? staffProfileByUserId.get(supportStaffUser.id) : null;
  const financeStaffProfile = financeStaffUser ? staffProfileByUserId.get(financeStaffUser.id) : null;
  const legalStaffProfile = legalStaffUser ? staffProfileByUserId.get(legalStaffUser.id) : null;
  const stockStaffProfile = stockStaffUser ? staffProfileByUserId.get(stockStaffUser.id) : null;

  for (let i = 0; i < toCreate; i += 1) {
    const customer = randomFrom(customers, i);
    const departmentBucket = i % 4;
    const departmentId =
      departmentBucket === 0
        ? supportDepartment?.id
        : departmentBucket === 1
          ? financeDepartment?.id
          : departmentBucket === 2
            ? legalDepartment?.id
            : stockDepartment?.id;

    if (!departmentId) continue;

    const assignedProfile =
      departmentBucket === 0
        ? supportStaffProfile
        : departmentBucket === 1
          ? financeStaffProfile
          : departmentBucket === 2
            ? legalStaffProfile
            : stockStaffProfile;

    const inquiry = await prisma.inquiry.create({
      data: {
        type: randomFrom([InquiryType.order, InquiryType.payment, InquiryType.legal, InquiryType.stock, InquiryType.author], i),
        departmentId,
        status: randomFrom([InquiryStatus.OPEN, InquiryStatus.ASSIGNED, InquiryStatus.IN_PROGRESS, InquiryStatus.RESOLVED], i),
        priority: randomFrom([InquiryPriority.LOW, InquiryPriority.MEDIUM, InquiryPriority.HIGH, InquiryPriority.URGENT], i + 1),
        createdByUserId: customer.id,
        assignedToStaffId: assignedProfile?.id ?? null,
        subject: `${FAKER_MARKER} Inquiry #${existingInquiries + i + 1}`,
        createdAt: daysAgo((i % 25) + 1),
      },
    });

    await prisma.inquiryMessage.createMany({
      data: [
        {
          inquiryId: inquiry.id,
          senderId: customer.id,
          senderType: 'USER',
          message: `${FAKER_MARKER} Customer message for inquiry triage and routing.`,
          createdAt: daysAgo((i % 24) + 1),
        },
        {
          inquiryId: inquiry.id,
          senderId: assignedProfile?.id ?? 'system',
          senderType: 'STAFF',
          message: `${FAKER_MARKER} Staff acknowledged and started processing this inquiry.`,
          createdAt: daysAgo((i % 20) + 1),
        },
      ],
    });

    if (assignedProfile) {
      await prisma.inquiryInternalNote.create({
        data: {
          inquiryId: inquiry.id,
          staffId: assignedProfile.id,
          note: `${FAKER_MARKER} Internal note: verify documents and respond within SLA.`,
          createdAt: daysAgo((i % 18) + 1),
        },
      });
    }

    const performerId = supportStaffUser?.id ?? customer.id;
    await prisma.inquiryAudit.createMany({
      data: [
        {
          inquiryId: inquiry.id,
          action: 'CREATED',
          performedByUserId: customer.id,
          createdAt: daysAgo((i % 25) + 1),
        },
        {
          inquiryId: inquiry.id,
          action: assignedProfile ? 'ASSIGNED' : 'STATUS_CHANGED',
          performedByUserId: performerId,
          createdAt: daysAgo((i % 20) + 1),
        },
      ],
    });
  }

  const existingContactMessages = await prisma.contactMessage.count({
    where: { email: { endsWith: '@faker.local' } },
  });
  const targetContactMessages = 24;
  const addMessages = Math.max(0, targetContactMessages - existingContactMessages);

  for (let i = 0; i < addMessages; i += 1) {
    const customer = randomFrom(customers, i);
    await prisma.contactMessage.create({
      data: {
        type: randomFrom([ContactType.support, ContactType.author, ContactType.publisher, ContactType.business, ContactType.legal], i),
        name: customer.name,
        email: `${customer.name.toLowerCase().replace(/\s+/g, '.')}@faker.local`,
        subject: `${FAKER_MARKER} Contact subject ${i + 1}`,
        message: `${FAKER_MARKER} Contact message body for workflow testing and notification routing.`,
        metadata: {
          source: 'faker-seed',
          priorityHint: randomFrom(['normal', 'high'], i),
        },
        status: i % 4 === 0 ? 'archived' : 'new',
        createdAt: daysAgo((i % 12) + 1),
      },
    });
  }

  const recipients = ['support@treasurehouse.local', 'ops@treasurehouse.local', 'finance@treasurehouse.local'];
  const existingFakerContactNotifications = await prisma.contactNotification.count({
    where: { subject: { startsWith: FAKER_MARKER } },
  });
  const targetContactNotifications = 18;
  const addContactNotifications = Math.max(0, targetContactNotifications - existingFakerContactNotifications);
  for (let i = 0; i < addContactNotifications; i += 1) {
    const index = existingFakerContactNotifications + i;
    await prisma.contactNotification.create({
      data: {
        type: randomFrom([ContactType.support, ContactType.author, ContactType.business, ContactType.legal], index),
        recipient: randomFrom(recipients, index),
        subject: `${FAKER_MARKER} Contact notification ${index + 1}`,
        body: 'A new inquiry was routed. Please review in the admin console.',
        createdAt: daysAgo((index % 10) + 1),
      },
    });
  }

  const notificationsUsers = customers.slice(0, 20);
  const notificationTypes = [
    NotificationType.support_reply,
    NotificationType.announcement,
    NotificationType.inquiry_update,
    NotificationType.system,
    NotificationType.blog_like,
    NotificationType.blog_comment,
    NotificationType.blog_follow,
    NotificationType.inquiry_created,
    NotificationType.inquiry_assigned,
    NotificationType.inquiry_escalated,
    NotificationType.inquiry_reply,
  ];

  const existingFakerUserNotifications = await prisma.notification.count({
    where: { title: { startsWith: FAKER_MARKER } },
  });
  const targetUserNotifications = 120;
  const addUserNotifications = Math.max(0, targetUserNotifications - existingFakerUserNotifications);

  const toInsertNotifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: Date;
  }> = [];

  for (let i = 0; i < addUserNotifications; i += 1) {
    const index = existingFakerUserNotifications + i;
    const user = randomFrom(notificationsUsers, index);
    const type = randomFrom(notificationTypes, index);
    toInsertNotifications.push({
      userId: user.id,
      type,
      title: `${FAKER_MARKER} ${type.replace(/_/g, ' ')}`,
      message: 'Generated notification for dropdown, unread count, and filter testing.',
      link: type.startsWith('blog_') ? '/blogs' : '/admin',
      isRead: index % 3 === 0,
      createdAt: daysAgo(index % 20, 8 + (index % 10)),
    });
  }

  if (toInsertNotifications.length > 0) {
    await prisma.notification.createMany({ data: toInsertNotifications });
  }
}

async function ensureBlogsAndSocial(
  authors: Awaited<ReturnType<typeof ensureCoreUsers>>['authors'],
  customers: Awaited<ReturnType<typeof ensureCoreUsers>>['customers'],
  books: Awaited<ReturnType<typeof ensureBooks>>,
) {
  const tagNames = [
    'Reading',
    'Productivity',
    'Technology',
    'Book Lists',
    'Workflows',
    'Critical Thinking',
    'Author Life',
    'Recommendations',
    'Learning Systems',
    'Notes & PKM',
    'Fiction',
    'Publishing',
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.blogTag.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  const tagByName = new Map(tags.map((tag) => [tag.name, tag]));

  const titleTemplates = [
    'How to Build a Weekly Reading Workflow That Actually Sticks',
    'The Hidden Cost of Reading Without a System',
    'A Better Way to Convert Highlights Into Decisions',
    'Five Books That Improve Product Judgment',
    'Why Most Book Recommendations Fail Context Tests',
    'From Purchase to Practice: A Reader Ops Framework',
    'How Teams Can Use Shared Reading for Better Execution',
    'The Quality Checklist I Use Before Publishing a Post',
    'What I Learned After Tracking 100 Reading Sessions',
    'How to Curate a Personal Canon for Long-Term Growth',
    'Book Notes That Survive Beyond Week One',
    'Operational Thinking for Creative Writers',
    'Reading Across Genres Without Losing Focus',
    'A Simple Scorecard for Choosing the Next Book',
    'What Makes a Post Truly Useful to Readers',
  ];

  const existingSeedPosts = await prisma.authorBlog.count({
    where: {
      title: {
        startsWith: `${FAKER_MARKER} `,
      },
    },
  });

  const targetPosts = 36;
  const toCreate = Math.max(0, targetPosts - existingSeedPosts);

  for (let i = 0; i < toCreate; i += 1) {
    const author = randomFrom(authors, i);
    const title = `${FAKER_MARKER} ${randomFrom(titleTemplates, i)} #${existingSeedPosts + i + 1}`;
    const subtitle = `Practical guidance on ${randomFrom(
      ['editorial systems', 'reader workflows', 'knowledge retention', 'content operations'],
      i,
    )}.`;

    const existing = await prisma.authorBlog.findFirst({
      where: { authorId: author.id, title },
      select: { id: true },
    });
    if (existing) continue;

    const tagSet = [
      randomFrom(tagNames, i),
      randomFrom(tagNames, i + 2),
      randomFrom(tagNames, i + 4),
    ];

    const refBooks = [
      randomFrom(books, i),
      randomFrom(books, i + 7),
      randomFrom(books, i + 13),
    ];

    await prisma.authorBlog.create({
      data: {
        authorId: author.id,
        title,
        subtitle,
        content: longBlogContent(randomFrom(tagSet, i), 'clarity, consistency, and transferability'),
        coverImage: i % 2 === 0 ? randomFrom(authors, i).coverImage : null,
        readingTime: 4 + (i % 7),
        status: BlogPostStatus.PUBLISHED,
        viewsCount: 40 + (i % 500),
        likesCount: 0,
        commentsCount: 0,
        createdAt: daysAgo((i % 60) + 1),
        tags: {
          create: tagSet
            .map((name) => tagByName.get(name)?.id)
            .filter((id): id is string => Boolean(id))
            .map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
        bookReferences: {
          create: refBooks.map((book) => ({
            book: { connect: { id: book.id } },
          })),
        },
      },
    });
  }

  const posts = await prisma.authorBlog.findMany({
    where: { status: BlogPostStatus.PUBLISHED },
    select: { id: true, authorId: true },
    orderBy: { createdAt: 'desc' },
    take: 120,
  });

  const readers = customers.slice(0, 28);

  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i];
    const liker1 = randomFrom(readers, i);
    const liker2 = randomFrom(readers, i + 4);
    const liker3 = randomFrom(readers, i + 9);

    for (const liker of [liker1, liker2, liker3]) {
      if (liker.id === post.authorId) continue;
      await prisma.blogLike.upsert({
        where: { postId_userId: { postId: post.id, userId: liker.id } },
        update: {},
        create: { postId: post.id, userId: liker.id },
      });
    }

    const commenter = randomFrom(readers, i + 3);
    if (commenter.id !== post.authorId) {
      const existingComment = await prisma.blogComment.findFirst({
        where: {
          blogId: post.id,
          userId: commenter.id,
          content: `${FAKER_MARKER} This post was useful for my weekly workflow.`,
        },
        select: { id: true },
      });
      if (!existingComment) {
        await prisma.blogComment.create({
          data: {
            blogId: post.id,
            userId: commenter.id,
            content: `${FAKER_MARKER} This post was useful for my weekly workflow.`,
            createdAt: daysAgo((i % 25) + 1),
          },
        });
      }
    }

    const follower = randomFrom(readers, i + 11);
    if (follower.id !== post.authorId) {
      await prisma.authorFollow.upsert({
        where: { followerId_authorId: { followerId: follower.id, authorId: post.authorId } },
        update: {},
        create: { followerId: follower.id, authorId: post.authorId },
      });
    }
  }

  for (const post of posts) {
    const [likesCount, commentsCount] = await Promise.all([
      prisma.blogLike.count({ where: { postId: post.id } }),
      prisma.blogComment.count({ where: { blogId: post.id } }),
    ]);

    await prisma.authorBlog.update({
      where: { id: post.id },
      data: { likesCount, commentsCount },
    });
  }

  const authorIds = authors.map((author) => author.id);
  const existingFakerBlogNotifications = await prisma.blogNotification.count({
    where: { message: { startsWith: FAKER_MARKER } },
  });
  const targetBlogNotifications = 40;
  const addBlogNotifications = Math.max(0, targetBlogNotifications - existingFakerBlogNotifications);
  for (let i = 0; i < addBlogNotifications; i += 1) {
    const index = existingFakerBlogNotifications + i;
    const recipient = randomFrom(authors, index);
    const post = randomFrom(posts, index);
    await prisma.blogNotification.create({
      data: {
        userId: recipient.id,
        blogId: post.id,
        authorId: randomFrom(authorIds, index + 2),
        message: `${FAKER_MARKER} New engagement on your blog profile.`,
        readAt: index % 4 === 0 ? daysAgo(index % 8) : null,
        createdAt: daysAgo((index % 14) + 1),
      },
    });
  }
}

async function main() {
  console.log('🌱 Starting full non-destructive faker seed...');

  const users = await ensureCoreUsers();
  const staffData = await ensureDepartmentsAndStaff(users.staffUsers, users.staffSeed);
  const books = await ensureBooks();
  const warehouses = await ensureWarehousesAndDistribution(books);
  const orderResult = await ensureOrdersAndLibrary(users.customers, books);
  await ensureVendorsAndProcurement(books, warehouses, staffData.staffProfileByUserId, users.staffUsers);
  await ensureInquiriesAndContacts(users.customers, staffData.departmentByCode as any, staffData.staffProfileByUserId, users.staffUsers);
  await ensureBlogsAndSocial(users.authors, users.customers, books);

  console.log('✅ Faker append seed completed.');
  console.log(`   - Users ensured: ${users.customers.length + users.staffUsers.length + users.authors.length + 2}`);
  console.log(`   - Books available: ${books.length}`);
  console.log(`   - Warehouses ensured: ${warehouses.length}`);
  console.log(`   - Orders created this run: ${orderResult.ordersCreated}`);
  console.log('🔑 Default logins:');
  console.log('   - Admin: admin@bookstore.com / admin123');
  console.log('   - Super Admin: super.admin@bookstore.com / admin123');
  console.log('   - Staff (example): stock.jane@example.com / staff123');
  console.log('   - Author (example): author.nora@example.com / author123');
  console.log('   - User (example): john.doe@example.com / user123');
  console.log('🛡️ Non-destructive: existing records are preserved and expanded.');
}

main()
  .catch((error) => {
    console.error('❌ Faker seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
