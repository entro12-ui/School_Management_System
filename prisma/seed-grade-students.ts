/**
 * Add 5 students per grade (KG = 0 through Grade 12) at the main branch.
 * Safe to re-run — only fills grades that have fewer than 5 active students.
 *
 * Run: npm run db:seed-students
 */
import { AcademicTerm, PrismaClient, SeniorStream } from "@prisma/client";
import { formatGradeLevel, gradeLevelToBand } from "../src/lib/grade-utils";
import { ensureSemesterPayment } from "../src/lib/semester-fees";

const prisma = new PrismaClient();

const FIRST_NAMES = ["Hanna", "Meron", "Lidya", "Sara", "Daniel", "Yonas", "Tigist", "Dawit", "Selam", "Birtukan"];
const LAST_NAMES = ["Abebe", "Kebede", "Tesfaye", "Haile", "Girma", "Bekele", "Alemu", "Mulugeta", "Tadesse", "Worku"];

const STUDENTS_PER_GRADE = 5;
const GRADE_LEVELS = Array.from({ length: 13 }, (_, i) => i); // 0 = KG … 12

function classNameForGrade(level: number): string {
  if (level === 0) return "KG-A";
  return `Grade ${level}-A`;
}

function defaultStream(level: number): SeniorStream | null {
  if (level >= 11) return SeniorStream.NATURAL_SCIENCE;
  return null;
}

async function assertDatabase() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    console.error(`
Cannot reach PostgreSQL. The seed script did not run.

Run:  npm run db:check

Render free databases sleep when idle — resume yours in the Render dashboard,
then copy a fresh External Database URL into .env.

Or use local Postgres:  docker compose up -d
Then set DATABASE_URL in .env to:
  postgresql://postgres:password@localhost:5432/school_management?schema=school_sms
`);
    process.exit(1);
  }
}

async function main() {
  await assertDatabase();

  const branch = await prisma.branch.findFirst({
    where: { code: "ADDIS", isActive: true },
  });

  if (!branch) {
    throw new Error("Branch ADDIS not found. Run npm run db:seed or create the branch first.");
  }

  const year = await prisma.academicYear.findFirst({
    where: { branchId: branch.id, isCurrent: true },
    orderBy: { startDate: "desc" },
  });

  if (!year) {
    throw new Error("No current academic year for ADDIS. Run npm run db:seed first.");
  }

  const yearCode = new Date().getFullYear();
  let created = 0;
  let skipped = 0;

  for (const gradeLevel of GRADE_LEVELS) {
    const gradeBand = gradeLevelToBand(gradeLevel);
    const stream = defaultStream(gradeLevel);

    let klass = await prisma.class.findFirst({
      where: {
        branchId: branch.id,
        academicYearId: year.id,
        gradeLevel,
        stream: stream ?? null,
      },
    });

    if (!klass) {
      klass = await prisma.class.create({
        data: {
          branchId: branch.id,
          academicYearId: year.id,
          name: classNameForGrade(gradeLevel),
          gradeLevel,
          gradeBand,
          stream,
        },
      });
      console.log(`+ Class ${klass.name}`);
    }

    const existingCount = await prisma.student.count({
      where: { branchId: branch.id, gradeLevel, isActive: true },
    });

    const toCreate = Math.max(0, STUDENTS_PER_GRADE - existingCount);
    if (toCreate === 0) {
      console.log(`○ ${formatGradeLevel(gradeLevel)}: already has ${existingCount} students`);
      skipped += STUDENTS_PER_GRADE;
      continue;
    }

    for (let slot = existingCount; slot < STUDENTS_PER_GRADE; slot++) {
      const idx = gradeLevel * STUDENTS_PER_GRADE + slot;
      const firstName = FIRST_NAMES[idx % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(idx + gradeLevel) % LAST_NAMES.length];
      const studentId = `STU-${yearCode}-G${String(gradeLevel).padStart(2, "0")}-${String(slot + 1).padStart(2, "0")}`;

      const exists = await prisma.student.findUnique({
        where: { branchId_studentId: { branchId: branch.id, studentId } },
      });

      if (exists) {
        skipped++;
        continue;
      }

      const student = await prisma.student.create({
        data: {
          branchId: branch.id,
          classId: klass.id,
          studentId,
          firstName,
          lastName,
          gradeBand,
          gradeLevel,
          stream,
          gender: slot % 2 === 0 ? "F" : "M",
          enrollmentDate: new Date(),
          isActive: true,
        },
      });

      try {
        await ensureSemesterPayment(student.id, AcademicTerm.SEMESTER_1);
      } catch {
        // fee / year edge cases
      }

      created++;
      console.log(`✓ ${studentId} — ${firstName} ${lastName} (${formatGradeLevel(gradeLevel)})`);
    }
  }

  console.log(`\nDone. Created ${created} student(s), skipped ${skipped} slot(s).`);
  console.log(`Target: ${STUDENTS_PER_GRADE} students × ${GRADE_LEVELS.length} grades = ${STUDENTS_PER_GRADE * GRADE_LEVELS.length} total at ${branch.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
