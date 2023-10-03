const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function main() {
  try {
    await db.category.createMany({
      data: [
          { name: 'Ethereal Companions', visibility: true },
          { name: 'Character Companions', visibility: true },
          { name: 'Counselling Companions', visibility: true },
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