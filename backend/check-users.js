require('dotenv/config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Current users:');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });
  
  console.table(users);
  
  // Update a user to admin if needed
  // Uncomment the lines below and replace the email with the user you want to make admin
  /*
  const updatedUser = await prisma.user.update({
    where: { email: 'user@example.com' }, // Replace with actual email
    data: { role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log('Updated user:', updatedUser);
  */
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });