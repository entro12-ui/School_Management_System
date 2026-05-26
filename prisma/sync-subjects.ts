/**
 * Upsert all catalog subjects without wiping the database.
 * Run: npx tsx prisma/sync-subjects.ts
 */
import { PrismaClient } from "@prisma/client";
import { SUBJECT_CATALOG } from "../src/lib/academic-catalog";

const prisma = new PrismaClient();

async function main() {
  for (const s of SUBJECT_CATALOG) {
    await prisma.subject.upsert({
      where: {
        code_gradeBand: { code: s.code, gradeBand: s.gradeBand },
      },
      create: {
        code: s.code,
        name: s.name,
        gradeBand: s.gradeBand,
        isCore: true,
      },
      update: { name: s.name },
    });
  }
  const count = await prisma.subject.count();
  console.log(`Synced ${SUBJECT_CATALOG.length} catalog subjects (${count} total in DB).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
