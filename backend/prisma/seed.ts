import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const coverFromIsbn = (isbn: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

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
  await prisma.user.create({
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
  const coreUsers = await Promise.all([
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

  // Create additional users
  console.log('👤 Creating additional users...');
  const extraUsersData = [
    { name: 'Alice Johnson', email: 'alice.johnson@example.com' },
    { name: 'Michael Brown', email: 'michael.brown@example.com' },
    { name: 'Sarah Davis', email: 'sarah.davis@example.com' },
    { name: 'David Miller', email: 'david.miller@example.com' },
    { name: 'Emily Wilson', email: 'emily.wilson@example.com' },
    { name: 'Christopher Moore', email: 'christopher.moore@example.com' },
    { name: 'Jessica Taylor', email: 'jessica.taylor@example.com' },
    { name: 'Daniel Anderson', email: 'daniel.anderson@example.com' },
    { name: 'Ashley Thomas', email: 'ashley.thomas@example.com' },
    { name: 'Matthew Jackson', email: 'matthew.jackson@example.com' },
    { name: 'Amanda White', email: 'amanda.white@example.com' },
    { name: 'James Harris', email: 'james.harris@example.com' },
    { name: 'Lauren Martin', email: 'lauren.martin@example.com' },
    { name: 'Joshua Thompson', email: 'joshua.thompson@example.com' },
    { name: 'Brianna Garcia', email: 'brianna.garcia@example.com' },
    { name: 'Andrew Martinez', email: 'andrew.martinez@example.com' },
    { name: 'Samantha Robinson', email: 'samantha.robinson@example.com' },
    { name: 'Ryan Clark', email: 'ryan.clark@example.com' },
    { name: 'Natalie Rodriguez', email: 'natalie.rodriguez@example.com' },
    { name: 'Kevin Lewis', email: 'kevin.lewis@example.com' },
  ];
  const extraUsers = await Promise.all(
    extraUsersData.map((user) =>
      prisma.user.create({
        data: {
          email: user.email,
          password: userPassword,
          name: user.name,
          role: Role.USER,
        },
      }),
    ),
  );

  const users = [...coreUsers, ...extraUsers];

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
        description:
          'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.',
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
        description:
          'A gripping tale of racial injustice and childhood innocence in the American South.',
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
        description:
          'A dystopian social science fiction novel about totalitarian control and surveillance.',
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
        description:
          'An epic science fiction novel set on the desert planet Arrakis.',
      },
    }),
    prisma.book.create({
      data: {
        title: "The Hitchhiker's Guide to the Galaxy",
        author: 'Douglas Adams',
        isbn: '978-0-345-39180-3',
        price: 11.99,
        stock: 22,
        description:
          "A comedic science fiction series following Arthur Dent's adventures through space.",
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
        description:
          'A handbook of agile software craftsmanship with practical advice for writing clean, maintainable code.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        isbn: '978-0-596-51774-8',
        price: 29.99,
        stock: 15,
        description:
          'A concise guide to the best features of JavaScript and how to use them effectively.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Design Patterns',
        author: 'Gang of Four',
        isbn: '978-0-201-63361-0',
        price: 54.99,
        stock: 6,
        description:
          'Elements of reusable object-oriented software design patterns.',
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
        description:
          'A controversial novel about teenage rebellion and alienation.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Brave New World',
        author: 'Aldous Huxley',
        isbn: '978-0-06-085052-4',
        price: 14.99,
        stock: 2,
        description:
          'A dystopian novel exploring a future society driven by technology and conditioning.',
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
        description:
          'An epic high fantasy novel following the quest to destroy the One Ring.',
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
        description:
          'A romantic novel about manners, upbringing, morality, and marriage in Georgian England.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Pragmatic Programmer',
        author: 'David Thomas and Andrew Hunt',
        isbn: '978-0-201-61622-4',
        price: 39.99,
        stock: 10,
        description:
          'A guide to becoming a better programmer through practical advice and techniques.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'Moby Dick',
        author: 'Herman Melville',
        isbn: '978-0-14-243724-7',
        price: 15.99,
        stock: 14,
        description:
          "The epic tale of Captain Ahab's obsessive quest for revenge against the white whale.",
      },
    }),
    prisma.book.create({
      data: {
        title: "You Don't Know JS",
        author: 'Kyle Simpson',
        isbn: '978-1-491-95019-1',
        price: 34.99,
        stock: 12,
        description:
          'A deep dive into the core mechanisms of the JavaScript language.',
      },
    }),

    // More Fiction
    prisma.book.create({
      data: {
        title: "Harry Potter and the Philosopher's Stone",
        author: 'J.K. Rowling',
        isbn: '978-0-439-70818-8',
        price: 19.99,
        stock: 35,
        description:
          'The first book in the Harry Potter series about a young wizard discovering his magical heritage.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        isbn: '978-0-547-92822-7',
        price: 16.99,
        stock: 28,
        description:
          'A fantasy adventure about Bilbo Baggins and his unexpected journey.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Da Vinci Code',
        author: 'Dan Brown',
        isbn: '978-0-307-47492-1',
        price: 15.99,
        stock: 22,
        description:
          'A mystery thriller involving secret societies and religious history.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        isbn: '978-0-06-112241-5',
        price: 14.99,
        stock: 30,
        description:
          'A philosophical novel about following your dreams and finding your destiny.',
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
        description:
          'An exploration of human history from the Stone Age to the modern age.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'A Brief History of Time',
        author: 'Stephen Hawking',
        isbn: '978-0-553-38016-3',
        price: 17.99,
        stock: 15,
        description:
          'A landmark volume in science writing exploring cosmology and the universe.',
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
        description:
          'A hands-on, project-based introduction to programming with Python.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Art of Computer Programming',
        author: 'Donald Knuth',
        isbn: '978-0-201-89683-1',
        price: 89.99,
        stock: 5,
        description:
          'A comprehensive monograph on computer programming algorithms.',
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
        description:
          'A psychological thriller about a marriage gone terribly wrong.',
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
        description:
          'An easy and proven way to build good habits and break bad ones.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Lean Startup',
        author: 'Eric Ries',
        isbn: '978-0-307-88791-7',
        price: 26.99,
        stock: 14,
        description:
          "How today's entrepreneurs use continuous innovation to create radically successful businesses.",
      },
    }),
    prisma.book.create({
      data: {
        title: 'Thinking, Fast and Slow',
        author: 'Daniel Kahneman',
        isbn: '978-0-374-53355-7',
        price: 18.99,
        stock: 17,
        description:
          'A groundbreaking tour of the mind explaining the two systems that drive the way we think.',
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
        description:
          'The first book in A Song of Ice and Fire series, an epic fantasy saga.',
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Name of the Wind',
        author: 'Patrick Rothfuss',
        isbn: '978-0-7564-0407-9',
        price: 17.99,
        stock: 21,
        description:
          'The first book in The Kingkiller Chronicle, a fantasy adventure.',
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
        description:
          'A psychological drama about morality, guilt, and redemption.',
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
        description:
          "A post-apocalyptic novel about a father and son's journey.",
      },
    }),
    prisma.book.create({
      data: {
        title: 'Life of Pi',
        author: 'Yann Martel',
        isbn: '978-0-15-602732-2',
        price: 14.99,
        stock: 3,
        description:
          'A philosophical adventure novel about survival and faith.',
      },
    }),

    // Additional books
    prisma.book.create({
      data: {
        title: 'The Silent Patient',
        author: 'Alex Michaelides',
        isbn: '978-1-250-30811-5',
        price: 16.99,
        stock: 18,
        description:
          'A psychological thriller about a woman who stops speaking after a shocking act.',
        categories: ['Mystery', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Educated',
        author: 'Tara Westover',
        isbn: '978-0-399-59050-4',
        price: 17.99,
        stock: 16,
        description:
          'A memoir about a woman who grows up in a survivalist family and pursues education.',
        categories: ['Biography', 'Memoir'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Martian',
        author: 'Andy Weir',
        isbn: '978-0-8041-3902-1',
        price: 15.99,
        stock: 20,
        description:
          'An astronaut stranded on Mars fights to survive with science and ingenuity.',
        categories: ['Science Fiction', 'Adventure'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        isbn: '978-0-593-13520-4',
        price: 19.99,
        stock: 14,
        description: 'A lone astronaut must save Earth from a cosmic threat.',
        categories: ['Science Fiction', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Circe',
        author: 'Madeline Miller',
        isbn: '978-0-316-55256-7',
        price: 16.99,
        stock: 17,
        description: 'A retelling of the life of the Greek goddess Circe.',
        categories: ['Fantasy', 'Mythology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Night Circus',
        author: 'Erin Morgenstern',
        isbn: '978-0-307-74783-9',
        price: 15.99,
        stock: 19,
        description:
          'A magical competition between two illusionists set in a mysterious circus.',
        categories: ['Fantasy', 'Romance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Normal People',
        author: 'Sally Rooney',
        isbn: '978-1-9821-4902-6',
        price: 14.99,
        stock: 21,
        description:
          'A nuanced story of love and friendship between two young people.',
        categories: ['Fiction', 'Romance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Midnight Library',
        author: 'Matt Haig',
        isbn: '978-0-525-55947-4',
        price: 16.99,
        stock: 22,
        description:
          'A woman explores alternate lives in a library between life and death.',
        categories: ['Fiction', 'Fantasy'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Becoming',
        author: 'Michelle Obama',
        isbn: '978-1-5247-6313-8',
        price: 18.99,
        stock: 13,
        description: 'A memoir by the former First Lady of the United States.',
        categories: ['Biography', 'Memoir'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Subtle Art of Not Giving a F*ck',
        author: 'Mark Manson',
        isbn: '978-0-06-245771-4',
        price: 15.99,
        stock: 24,
        description: 'A counterintuitive approach to living a good life.',
        categories: ['Self-Help', 'Psychology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Deep Work',
        author: 'Cal Newport',
        isbn: '978-1-4555-4484-5',
        price: 16.99,
        stock: 12,
        description: 'Rules for focused success in a distracted world.',
        categories: ['Business', 'Productivity'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The 7 Habits of Highly Effective People',
        author: 'Stephen R. Covey',
        isbn: '978-1-9821-3583-8',
        price: 17.99,
        stock: 18,
        description:
          'A classic guide to personal and professional effectiveness.',
        categories: ['Self-Help', 'Business'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Rich Dad Poor Dad',
        author: 'Robert T. Kiyosaki',
        isbn: '978-1-61268-019-4',
        price: 14.99,
        stock: 20,
        description: 'Lessons on money and investing from two father figures.',
        categories: ['Business', 'Finance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Power of Habit',
        author: 'Charles Duhigg',
        isbn: '978-0-8129-8160-5',
        price: 16.99,
        stock: 17,
        description: 'How habits work and how to change them.',
        categories: ['Psychology', 'Self-Help'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Four Agreements',
        author: 'Don Miguel Ruiz',
        isbn: '978-1-879842-33-6',
        price: 11.99,
        stock: 23,
        description: 'A practical guide to personal freedom.',
        categories: ['Self-Help', 'Spirituality'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Body Keeps the Score',
        author: 'Bessel van der Kolk',
        isbn: '978-0-670-78593-3',
        price: 19.99,
        stock: 14,
        description: 'Understanding trauma and healing through mind and body.',
        categories: ['Psychology', 'Health'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        isbn: '978-0-85719-768-9',
        price: 15.99,
        stock: 25,
        description: 'Timeless lessons on wealth, greed, and happiness.',
        categories: ['Business', 'Finance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Song of Achilles',
        author: 'Madeline Miller',
        isbn: '978-0-06-206062-4',
        price: 15.99,
        stock: 18,
        description:
          'A retelling of the Trojan War through the eyes of Patroclus.',
        categories: ['Fantasy', 'Mythology'],
      },
    }),
    prisma.book.create({
      data: {
        title: "The Handmaid's Tale",
        author: 'Margaret Atwood',
        isbn: '978-0-385-49081-8',
        price: 14.99,
        stock: 20,
        description:
          "A dystopian novel about a theocratic society and a woman's resistance.",
        categories: ['Fiction', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Road to Wigan Pier',
        author: 'George Orwell',
        isbn: '978-0-15-676750-1',
        price: 13.99,
        stock: 10,
        description: 'A social study of the working class in Northern England.',
        categories: ['History', 'Nonfiction'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Outsiders',
        author: 'S.E. Hinton',
        isbn: '978-0-14-038572-3',
        price: 11.99,
        stock: 22,
        description: 'A coming-of-age story about rival teen groups.',
        categories: ['Fiction', 'Young Adult'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Maze Runner',
        author: 'James Dashner',
        isbn: '978-0-385-73794-4',
        price: 12.99,
        stock: 21,
        description: 'Teens wake up in a maze and must solve its mystery.',
        categories: ['Young Adult', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Hunger Games',
        author: 'Suzanne Collins',
        isbn: '978-0-439-02348-1',
        price: 12.99,
        stock: 27,
        description: 'A girl fights for survival in a televised death match.',
        categories: ['Young Adult', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Giver',
        author: 'Lois Lowry',
        isbn: '978-0-544-33732-9',
        price: 11.99,
        stock: 19,
        description:
          'A boy discovers the dark secrets of his seemingly perfect society.',
        categories: ['Young Adult', 'Dystopian'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'A Man Called Ove',
        author: 'Fredrik Backman',
        isbn: '978-1-4767-3154-3',
        price: 14.99,
        stock: 18,
        description:
          "A grumpy man's life changes through unexpected friendships.",
        categories: ['Fiction', 'Contemporary'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Kite Runner',
        author: 'Khaled Hosseini',
        isbn: '978-1-59448-000-3',
        price: 15.99,
        stock: 16,
        description:
          'A story of friendship, betrayal, and redemption in Afghanistan.',
        categories: ['Fiction', 'Historical'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Book Thief',
        author: 'Markus Zusak',
        isbn: '978-0-375-84220-7',
        price: 14.99,
        stock: 18,
        description: 'A young girl in Nazi Germany finds solace in books.',
        categories: ['Historical', 'Young Adult'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Girl on the Train',
        author: 'Paula Hawkins',
        isbn: '978-1-59463-366-9',
        price: 14.99,
        stock: 20,
        description:
          'A psychological thriller about a woman entangled in a missing-persons case.',
        categories: ['Mystery', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Big Little Lies',
        author: 'Liane Moriarty',
        isbn: '978-0-399-16810-9',
        price: 15.99,
        stock: 19,
        description: 'A murder mystery within a group of suburban mothers.',
        categories: ['Fiction', 'Mystery'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Immortal Life of Henrietta Lacks',
        author: 'Rebecca Skloot',
        isbn: '978-1-4000-5218-9',
        price: 16.99,
        stock: 14,
        description: 'The story of the woman behind the HeLa cell line.',
        categories: ['Biography', 'Science'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Quiet',
        author: 'Susan Cain',
        isbn: '978-0-307-35215-6',
        price: 15.99,
        stock: 18,
        description:
          "The power of introverts in a world that can't stop talking.",
        categories: ['Psychology', 'Self-Help'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Born a Crime',
        author: 'Trevor Noah',
        isbn: '978-0-399-58817-4',
        price: 16.99,
        stock: 17,
        description: 'A memoir about growing up in apartheid South Africa.',
        categories: ['Biography', 'Memoir'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Immortal Irishman',
        author: 'Timothy Egan',
        isbn: '978-0-544-37217-7',
        price: 17.99,
        stock: 10,
        description: 'The saga of Thomas Meagher and the Irish revolution.',
        categories: ['History', 'Biography'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Wright Brothers',
        author: 'David McCullough',
        isbn: '978-1-4767-2077-6',
        price: 18.99,
        stock: 12,
        description: 'A biography of the pioneers of flight.',
        categories: ['History', 'Biography'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Thinking in Systems',
        author: 'Donella H. Meadows',
        isbn: '978-1-60358-055-7',
        price: 21.99,
        stock: 9,
        description: 'A primer on systems thinking and analysis.',
        categories: ['Science', 'Business'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Design of Everyday Things',
        author: 'Don Norman',
        isbn: '978-0-465-05065-9',
        price: 22.99,
        stock: 11,
        description: 'A classic on human-centered design.',
        categories: ['Design', 'Business'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Refactoring',
        author: 'Martin Fowler',
        isbn: '978-0-13-475759-9',
        price: 49.99,
        stock: 7,
        description: 'Improving the design of existing code.',
        categories: ['Programming', 'Technology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Effective TypeScript',
        author: 'Dan Vanderkam',
        isbn: '978-1-4920-5037-3',
        price: 39.99,
        stock: 9,
        description: '62 specific ways to improve your TypeScript.',
        categories: ['Programming', 'Technology'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Grit',
        author: 'Angela Duckworth',
        isbn: '978-1-5011-1710-1',
        price: 16.99,
        stock: 18,
        description: 'The power of passion and perseverance.',
        categories: ['Psychology', 'Self-Help'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Immortal Life of Henrietta Lacks: Young Readers Edition',
        author: 'Rebecca Skloot',
        isbn: '978-0-385-37492-7',
        price: 13.99,
        stock: 15,
        description: 'A young readers edition of the story behind HeLa cells.',
        categories: ['Science', 'Young Adult'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Wind-Up Bird Chronicle',
        author: 'Haruki Murakami',
        isbn: '978-0-679-77276-5',
        price: 17.99,
        stock: 12,
        description:
          'A surreal mystery involving a missing wife and a strange well.',
        categories: ['Fiction', 'Mystery'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'Norwegian Wood',
        author: 'Haruki Murakami',
        isbn: '978-0-375-70402-4',
        price: 14.99,
        stock: 19,
        description: 'A nostalgic story of love and loss in 1960s Tokyo.',
        categories: ['Fiction', 'Romance'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Three-Body Problem',
        author: 'Liu Cixin',
        isbn: '978-0-7653-7055-3',
        price: 18.99,
        stock: 13,
        description: "Humanity's first contact with an alien civilization.",
        categories: ['Science Fiction', 'Thriller'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Fifth Season',
        author: 'N.K. Jemisin',
        isbn: '978-0-316-22929-2',
        price: 16.99,
        stock: 14,
        description: 'A world-ending catastrophe and those who survive it.',
        categories: ['Fantasy', 'Science Fiction'],
      },
    }),
    prisma.book.create({
      data: {
        title: 'The Ocean at the End of the Lane',
        author: 'Neil Gaiman',
        isbn: '978-0-06-225565-5',
        price: 14.99,
        stock: 20,
        description: 'A man revisits his childhood and a mysterious girl.',
        categories: ['Fantasy', 'Fiction'],
      },
    }),
  ]);

  // Ensure all books have cover images
  console.log('🖼️  Ensuring cover images...');
  const booksNeedingCovers = await prisma.book.findMany({
    where: { OR: [{ coverImage: null }, { coverImage: '' }] },
    select: { id: true, isbn: true },
  });
  await Promise.all(
    booksNeedingCovers.map((book) =>
      prisma.book.update({
        where: { id: book.id },
        data: { coverImage: coverFromIsbn(book.isbn) },
      }),
    ),
  );

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

  // Create reviews and update book ratings
  console.log('⭐ Creating reviews...');
  const reviewComments = [
    'Loved the pacing and character development.',
    'Great read, would recommend.',
    'Solid book with a few slow parts.',
    'Interesting ideas and engaging writing.',
    'Well written and easy to follow.',
    'Enjoyed it more than I expected.',
    'A bit long, but worth it.',
    'Great for fans of the genre.',
    'Strong start and satisfying ending.',
    'Good value for the price.',
  ];

  const reviewCreates = users.flatMap((user, index) => {
    const firstBookIndex = (index * 2) % books.length;
    const secondBookIndex = (index * 2 + 7) % books.length;
    const rating1 = 3 + (index % 3); // 3-5
    const rating2 = 4 + (index % 2); // 4-5
    return [
      prisma.review.create({
        data: {
          userId: user.id,
          bookId: books[firstBookIndex].id,
          rating: rating1,
          comment: reviewComments[index % reviewComments.length],
        },
      }),
      prisma.review.create({
        data: {
          userId: user.id,
          bookId: books[secondBookIndex].id,
          rating: rating2,
          comment: reviewComments[(index + 3) % reviewComments.length],
        },
      }),
    ];
  });

  await Promise.all(reviewCreates);

  const ratingAverages = await prisma.review.groupBy({
    by: ['bookId'],
    _avg: { rating: true },
  });
  await Promise.all(
    ratingAverages.map((entry) =>
      prisma.book.update({
        where: { id: entry.bookId },
        data: { rating: entry._avg.rating ?? 0 },
      }),
    ),
  );

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
  console.log(`   - 23 regular users (password: user123)`);
  console.log(`   - 71 books (various genres and stock levels)`);
  console.log(`   - 4 cart items`);
  console.log(`   - 2 orders with 3 order items`);
  console.log(`   - ${users.length * 2} reviews`);
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
