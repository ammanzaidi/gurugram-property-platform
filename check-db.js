const { PrismaClient } = require("./src/generated/prisma");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || "file:./dev.db" }),
});

async function main() {
  const [users, properties, enquiries] = await Promise.all([
    prisma.user.count(),
    prisma.property.count(),
    prisma.enquiry.count(),
  ]);
  console.log({ users, properties, enquiries });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
