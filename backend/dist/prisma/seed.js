"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    console.log('🧹 Clearing existing data...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.book.deleteMany();
    await prisma.user.deleteMany();
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@bookstore.com',
            password: adminPassword,
            name: 'Admin User',
            role: client_1.Role.ADMIN,
        },
    });
    console.log('👥 Creating regular users...');
    const userPassword = await bcrypt.hash('user123', 10);
    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: 'john.doe@example.com',
                password: userPassword,
                name: 'John Doe',
                role: client_1.Role.USER,
            },
        }),
        prisma.user.create({
            data: {
                email: 'jane.smith@example.com',
                password: userPassword,
                name: 'Jane Smith',
                role: client_1.Role.USER,
            },
        }),
        prisma.user.create({
            data: {
                email: 'bob.wilson@example.com',
                password: userPassword,
                name: 'Bob Wilson',
                role: client_1.Role.USER,
            },
        }),
    ]);
    console.log('📚 Creating sample books...');
    const books = await Promise.all([
        prisma.book.create({
            data: {
                title: 'The Great Gatsby',
                author: 'F. Scott Fitzgerald',
                isbn: '978-0-7432-7356-5',
                price: 12.99,
                stock: 25,
                description: 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.',
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
            },
        }),
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
    ]);
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
    console.log(`   - 15 books (various stock levels)`);
    console.log(`   - 4 cart items`);
    console.log(`   - 2 orders with 3 order items`);
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
//# sourceMappingURL=seed.js.map