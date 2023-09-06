const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  try {
    await db.category.deleteMany({
      where: {
        OR: [
          { name: 'Learning Companions' },
          { name: 'Divination Companions' },
        ],
      },
    });
  } catch (error) {
    console.error('Error deleting categories:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
