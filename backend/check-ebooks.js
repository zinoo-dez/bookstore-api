require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Digital books in database:');
  const books = await prisma.book.findMany({
    where: { isDigital: true },
    select: {
      id: true,
      title: true,
      isDigital: true,
      ebookFormat: true,
      ebookFilePath: true,
      totalPages: true,
    },
  });
  
  console.table(books);
  console.log(`\nTotal digital books: ${books.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
