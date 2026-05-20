/**
 * Legacy migration for payments before semester billing.
 * No-op if all payments already have academicYearId and term.
 *
 * Run: npx tsx prisma/migrate-semester-payments.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.payment.count();
  console.log(`Payments in database: ${total}`);
  console.log(
    "Semester fields are required on new schemas. If you still see errors, run npm run db:push."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
