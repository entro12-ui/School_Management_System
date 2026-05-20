/**
 * Ensure default system settings exist (safe to re-run).
 * Run: npm run db:ensure-settings
 */
import { PrismaClient } from "@prisma/client";
import { ensureSystemSettings } from "../src/lib/system-settings";

const prisma = new PrismaClient();

ensureSystemSettings()
  .then(() => console.log("✓ System settings ready."))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
