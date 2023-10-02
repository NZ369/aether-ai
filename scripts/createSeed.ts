/*
const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  try {
    await db.category.createMany({
      data: [
          { name: 'Learning Companions', visibility: false },
          { name: 'Divination Companions', visibility: false },
        ],
    });
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
*/