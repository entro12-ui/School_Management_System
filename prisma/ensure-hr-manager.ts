/**
 * Ensure HR Manager role exists and assign to hr.addis@school.et
 * Run: npx tsx prisma/ensure-hr-manager.ts
 */
import { PrismaClient } from "@prisma/client";
import { ensureHrRbacDefaults } from "../src/lib/services/hr";

const prisma = new PrismaClient();

async function main() {
  await ensureHrRbacDefaults();

  const user = await prisma.user.findUnique({
    where: { email: "hr.addis@school.et" },
  });
  const role = await prisma.hrRole.findUnique({
    where: { name: "HR Manager" },
  });

  if (!user || !role) {
    console.error("HR user or HR Manager role missing. Run npm run db:seed first.");
    process.exit(1);
  }

  await prisma.hrUserRole.deleteMany({ where: { userId: user.id } });
  await prisma.hrUserRole.create({
    data: { userId: user.id, roleId: role.id },
  });

  console.log("✓", user.email, "is now HR Manager with full HR permissions.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
