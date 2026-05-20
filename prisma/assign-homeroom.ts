/**
 * @deprecated Homeroom must be assigned per class in Branch → Classes after teachers are enrolled.
 * This script only clears duplicate homeroom rows (same teacher on many classes).
 *
 * Run: npm run db:clear-homeroom
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const primaryAssignments = await prisma.classTeacher.findMany({
    where: { isPrimary: true },
    include: {
      class: { select: { name: true, branchId: true } },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  const byTeacher = new Map<string, typeof primaryAssignments>();
  for (const row of primaryAssignments) {
    const list = byTeacher.get(row.teacherId) ?? [];
    list.push(row);
    byTeacher.set(row.teacherId, list);
  }

  let cleared = 0;
  for (const [, rows] of byTeacher) {
    if (rows.length <= 1) continue;
    for (const row of rows.slice(1)) {
      await prisma.classTeacher.update({
        where: { id: row.id },
        data: { isPrimary: false },
      });
      console.log(
        `Cleared duplicate homeroom: ${row.teacher.user.firstName} from ${row.class.name}`
      );
      cleared++;
    }
  }

  console.log(
    cleared > 0
      ? `Done. Cleared ${cleared} duplicate assignment(s). Assign homeroom per class in the app.`
      : "No duplicate homeroom assignments found."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
