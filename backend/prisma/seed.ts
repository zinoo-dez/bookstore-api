import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bookstore.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  // Create regular users
  console.log('👥 Creating regular users...');
  const userPassword = await bcrypt.hash('user123', 10);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        password: userPassword,
        name: 'John Doe',
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        password: userPassword,
        name: 'Jane Smith',
        role: Role.USER,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob.wilson@example.com',
        password: userPassword,
        name: 'Bob Wilson',
        role: Role.USER,
      },
    }),
  ]);

  // Create sample books
  console.log('📚 Creating sample books...');
  const books = await Promise.all([
    // Fiction books
    prisma.book.create({
      data: {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0-7432-7356-5',
        price: 12.99,
        stock: 25,
        description: 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg',
        rating: 4.4,
        categories: ['Fiction', 'Classic'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0-06-112008-4',
        price: 14.99,
        stock: 18,
        description: 'A gripping tale of racial injustice and childhood innocence in the American South.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg',
        rating: 4.8,
        categories: ['Fiction', 'Classic'],
      },
    }),
    prisma.book.create({
      data: {
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0-452-28423-4',
        price: 13.99,
        stock: 30,
        description: 'A dystopian social science fiction novel about totalitarian control and surveillance.',
        coverImage: 'https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg',
        rating: 4.6,
        categories: ['Fiction', 'Dystopian', 'Classic'],
      },
    }),
    
    // Science Fiction
    prisma.book.create({
      data: {
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '978-0-441-17271-9',
        price: 16.99,
        stock: 12,
        description: 'An epic science fiction novel set on the desert planet Arrakis.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Hitchhiker\'s Guide to the Galaxy',
        author: 'Douglas Adams',
        isbn: '978-0-345-39180-3',
        price: 11.99,
        stock: 22,
        description: 'A comedic science fiction series following Arthur Dent\'s adventures through space.',
      },
    }),
    
    // Programming books
    prisma.book.create({
      data: {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0-13-235088-4',
        price: 42.99,
        stock: 8,
        description: 'A handbook of agile software craftsmanship with practical advice for writing clean, maintainable code.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        isbn: '978-0-596-51774-8',
        price: 29.99,
        stock: 15,
        description: 'A concise guide to the best features of JavaScript and how to use them effectively.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Design Patterns',
        author: 'Gang of Four',
        isbn: '978-0-201-63361-0',
        price: 54.99,
        stock: 6,
        description: 'Elements of reusable object-oriented software design patterns.',
      },
    }),
    
    // Low stock books
    prisma.book.create({
      data: {
        title: 'The Catcher in the Rye',
        author: 'J.D. Salinger',
        isbn: '978-0-316-76948-0',
        price: 13.99,
        stock: 3,
        description: 'A controversial novel about teenage rebellion and alienation.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        isbn: '978-0-06-085052-4',
        price: 14.99,
        stock: 2,
        description: 'A dystopian novel exploring a future society driven by technology and conditioning.',
      },
    }),
    
    // Out of stock book
    prisma.book.create({
      data: {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        isbn: '978-0-544-00341-5',
        price: 24.99,
        stock: 0,
        description: 'An epic high fantasy novel following the quest to destroy the One Ring.',
      },
    }),
    
    // More books for variety
    prisma.book.create({
      data: {
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        isbn: '978-0-14-143951-8',
        price: 12.99,
        stock: 20,
        description: 'A romantic novel about manners, upbringing, morality, and marriage in Georgian England.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Pragmatic Programmer',
        author: 'David Thomas and Andrew Hunt',
        isbn: '978-0-201-61622-4',
        price: 39.99,
        stock: 10,
        description: 'A guide to becoming a better programmer through practical advice and techniques.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Moby Dick',
        author: 'Herman Melville',
        isbn: '978-0-14-243724-7',
        price: 15.99,
        stock: 14,
        description: 'The epic tale of Captain Ahab\'s obsessive quest for revenge against the white whale.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'You Don\'t Know JS',
        author: 'Kyle Simpson',
        isbn: '978-1-491-95019-1',
        price: 34.99,
        stock: 12,
        description: 'A deep dive into the core mechanisms of the JavaScript language.',
      },
    }),
    
    // More Fiction
    prisma.book.create({
      data: {
        title: 'Harry Potter and the Philosopher\'s Stone',
        author: 'J.K. Rowling',
        isbn: '978-0-439-70818-8',
        price: 19.99,
        stock: 35,
        description: 'The first book in the Harry Potter series about a young wizard discovering his magical heritage.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        isbn: '978-0-547-92822-7',
        price: 16.99,
        stock: 28,
        description: 'A fantasy adventure about Bilbo Baggins and his unexpected journey.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        isbn: '978-0-307-47492-1',
        price: 15.99,
        stock: 22,
        description: 'A mystery thriller involving secret societies and religious history.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        isbn: '978-0-06-112241-5',
        price: 14.99,
        stock: 30,
        description: 'A philosophical novel about following your dreams and finding your destiny.',
      },
    }),
    
    // Science & Technology
    prisma.book.create({
      data: {
        title: 'Sapiens: A Brief History of Humankind',
        author: 'Yuval Noah Harari',
        isbn: '978-0-06-231609-7',
        price: 18.99,
        stock: 20,
        description: 'An exploration of human history from the Stone Age to the modern age.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '978-0-553-38016-3',
        price: 17.99,
        stock: 15,
        description: 'A landmark volume in science writing exploring cosmology and the universe.',
      },
    }),
    
    // More Programming
    prisma.book.create({
      data: {
        title: 'Eloquent JavaScript',
        author: 'Marijn Haverbeke',
        isbn: '978-1-59327-950-9',
        price: 32.99,
        stock: 18,
        description: 'A modern introduction to programming with JavaScript.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Python Crash Course',
        author: 'Eric Matthes',
        isbn: '978-1-59327-928-8',
        price: 39.99,
        stock: 16,
        description: 'A hands-on, project-based introduction to programming with Python.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Art of Computer Programming',
        author: 'Donald Knuth',
        isbn: '978-0-201-89683-1',
        price: 89.99,
        stock: 5,
        description: 'A comprehensive monograph on computer programming algorithms.',
      },
    }),
    
    // Mystery & Thriller
    prisma.book.create({
      data: {
        title: 'Gone Girl',
        author: 'Gillian Flynn',
        isbn: '978-0-307-58836-4',
        price: 15.99,
        stock: 24,
        description: 'A psychological thriller about a marriage gone terribly wrong.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Girl with the Dragon Tattoo',
        author: 'Stieg Larsson',
        isbn: '978-0-307-45454-1',
        price: 16.99,
        stock: 19,
        description: 'A gripping mystery thriller set in Sweden.',
      },
    }),
    
    // Self-Help & Business
    prisma.book.create({
      data: {
        title: 'Atomic Habits',
        author: 'James Clear',
        isbn: '978-0-7352-1129-2',
        price: 16.99,
        stock: 40,
        description: 'An easy and proven way to build good habits and break bad ones.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        isbn: '978-0-307-88791-7',
        price: 26.99,
        stock: 14,
        description: 'How today\'s entrepreneurs use continuous innovation to create radically successful businesses.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '978-0-374-53355-7',
        price: 18.99,
        stock: 17,
        description: 'A groundbreaking tour of the mind explaining the two systems that drive the way we think.',
      },
    }),
    
    // Fantasy
    prisma.book.create({
      data: {
        title: 'A Game of Thrones',
        author: 'George R.R. Martin',
        isbn: '978-0-553-10354-0',
        price: 19.99,
        stock: 26,
        description: 'The first book in A Song of Ice and Fire series, an epic fantasy saga.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        isbn: '978-0-7564-0407-9',
        price: 17.99,
        stock: 21,
        description: 'The first book in The Kingkiller Chronicle, a fantasy adventure.',
      },
    }),
    
    // More Classics
    prisma.book.create({
      data: {
        title: 'Crime and Punishment',
        author: 'Fyodor Dostoevsky',
        isbn: '978-0-14-310575-5',
        price: 14.99,
        stock: 11,
        description: 'A psychological drama about morality, guilt, and redemption.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Wuthering Heights',
        author: 'Emily Brontë',
        isbn: '978-0-14-143955-6',
        price: 12.99,
        stock: 13,
        description: 'A tale of passion and revenge on the Yorkshire moors.',
      },
    }),
    
    // Low stock items
    prisma.book.create({
      data: {
        title: 'The Road',
        author: 'Cormac McCarthy',
        isbn: '978-0-307-38789-9',
        price: 15.99,
        stock: 4,
        description: 'A post-apocalyptic novel about a father and son\'s journey.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Life of Pi',
        author: 'Yann Martel',
        isbn: '978-0-15-602732-2',
        price: 14.99,
        stock: 3,
        description: 'A philosophical adventure novel about survival and faith.',
      },
    }),
  ]);

  // Create some sample cart items for users
  console.log('🛒 Creating sample cart items...');
  await Promise.all([
    prisma.cartItem.create({
      data: {
        userId: users[0].id,
        bookId: books[0].id,
        quantity: 2,
      },
    }),
    prisma.cartItem.create({
      data: {
        userId: users[0].id,
        bookId: books[5].id,
        quantity: 1,
      },
    }),
    prisma.cartItem.create({
      data: {
        userId: users[1].id,
        bookId: books[2].id,
        quantity: 1,
      },
    }),
    prisma.cartItem.create({
      data: {
        userId: users[1].id,
        bookId: books[6].id,
        quantity: 1,
      },
    }),
  ]);

  // Create some sample orders
  console.log('📦 Creating sample orders...');
  const order1 = await prisma.order.create({
    data: {
      userId: users[2].id,
      totalPrice: 26.98,
      status: 'COMPLETED',
    },
  });

  await Promise.all([
    prisma.orderItem.create({
      data: {
        orderId: order1.id,
        bookId: books[1].id,
        quantity: 1,
        price: 14.99,
      },
    }),
    prisma.orderItem.create({
      data: {
        orderId: order1.id,
        bookId: books[4].id,
        quantity: 1,
        price: 11.99,
      },
    }),
  ]);

  const order2 = await prisma.order.create({
    data: {
      userId: users[0].id,
      totalPrice: 42.99,
      status: 'PENDING',
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: order2.id,
      bookId: books[5].id,
      quantity: 1,
      price: 42.99,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:`);
  console.log(`   - 1 admin user (admin@bookstore.com / admin123)`);
  console.log(`   - 3 regular users (password: user123)`);
  console.log(`   - 35 books (various genres and stock levels)`);
  console.log(`   - 4 cart items`);
  console.log(`   - 2 orders with 3 order items`);
  console.log(`\n📚 Book Categories:`);
  console.log(`   - Fiction & Classics`);
  console.log(`   - Science Fiction & Fantasy`);
  console.log(`   - Programming & Technology`);
  console.log(`   - Mystery & Thriller`);
  console.log(`   - Self-Help & Business`);
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Admin: admin@bookstore.com / admin123`);
  console.log(`   Users: john.doe@example.com / user123`);
  console.log(`          jane.smith@example.com / user123`);
  console.log(`          bob.wilson@example.com / user123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });