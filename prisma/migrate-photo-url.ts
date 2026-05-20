/**
 * Ensures User.photoUrl exists (staff profile photos).
 * Run: npm run db:migrate-photo
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
  `);
  console.log("✓ User.photoUrl column is ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
