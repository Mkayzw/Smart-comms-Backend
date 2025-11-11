const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Handle connection errors
prisma.$connect()
  .then(() => {
    console.log(' Database connected successfully');
  })
  .catch((error) => {
    console.error(' Database connection failed:', error);
    process.exit(1);
  });


process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;

