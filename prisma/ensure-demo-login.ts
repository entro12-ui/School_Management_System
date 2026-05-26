/**
 * Upsert demo login accounts (does not wipe data).
 * Run: npm run db:ensure-demo
 */
import {
  AcademicTerm,
  GradeBand,
  PrismaClient,
  SeniorStream,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { gradeLevelToBand } from "../src/lib/grade-utils";
import { ensureSemesterPayment } from "../src/lib/semester-fees";

const prisma = new PrismaClient();
const password = "demo1234";

type DemoUser = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchCode?: string;
  branchId?: string | null;
  department?: string;
  gradeLevel?: number;
  stream?: SeniorStream;
  studentCode?: string;
  guardianEmail?: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    email: "superadmin@school.et",
    firstName: "Central",
    lastName: "Administrator",
    role: UserRole.SUPER_ADMIN,
    branchId: null,
  },
  {
    email: "admin.addis@school.et",
    firstName: "Selam",
    lastName: "Bekele",
    role: UserRole.BRANCH_ADMIN,
    branchCode: "ADDIS",
  },
  {
    email: "registrar.addis@school.et",
    firstName: "Tigist",
    lastName: "Alemu",
    role: UserRole.REGISTRAR,
    branchCode: "ADDIS",
  },
  {
    email: "teacher.addis@school.et",
    firstName: "Meron",
    lastName: "Haile",
    role: UserRole.TEACHER,
    branchCode: "ADDIS",
    department: "Primary (1–5)",
  },
  {
    email: "finance.addis@school.et",
    firstName: "Hanna",
    lastName: "Girma",
    role: UserRole.FINANCE_OFFICER,
    branchCode: "ADDIS",
    department: "Finance",
  },
  {
    email: "library.addis@school.et",
    firstName: "Yonas",
    lastName: "Kebede",
    role: UserRole.LIBRARIAN,
    branchCode: "ADDIS",
    department: "Library",
  },
  {
    email: "parent@school.et",
    firstName: "Abebe",
    lastName: "Kebede",
    role: UserRole.PARENT,
    branchCode: "ADDIS",
  },
  {
    email: "student@school.et",
    firstName: "Lidya",
    lastName: "Abebe",
    role: UserRole.STUDENT,
    branchCode: "ADDIS",
    gradeLevel: 0,
    studentCode: "STU-DEMO-001",
    guardianEmail: "parent@school.et",
  },
  {
    email: "student.grade10@school.et",
    firstName: "Daniel",
    lastName: "Tadesse",
    role: UserRole.STUDENT,
    branchCode: "ADDIS",
    gradeLevel: 10,
    stream: SeniorStream.NATURAL_SCIENCE,
    studentCode: "STU-DEMO-002",
  },
];

function staffPrefix(role: UserRole): string {
  switch (role) {
    case UserRole.TEACHER:
      return "T";
    case UserRole.FINANCE_OFFICER:
      return "F";
    case UserRole.LIBRARIAN:
      return "L";
    default:
      return "S";
  }
}

async function resolveBranchId(demo: DemoUser): Promise<string | null> {
  if (demo.branchId !== undefined) return demo.branchId;
  if (!demo.branchCode) return null;
  const branch = await prisma.branch.findUnique({ where: { code: demo.branchCode } });
  return branch?.id ?? null;
}

async function ensureStaffProfile(
  userId: string,
  branchId: string,
  role: UserRole,
  department?: string
) {
  const existing = await prisma.staffProfile.findUnique({ where: { userId } });
  if (existing) return;

  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: branchId } });
  const count = await prisma.staffProfile.count({ where: { branchId } });
  const prefix = staffPrefix(role);

  await prisma.staffProfile.create({
    data: {
      userId,
      branchId,
      employeeId: `${prefix}-${branch.code}-${String(count + 1).padStart(4, "0")}`,
      department: department ?? null,
      hireDate: new Date(),
    },
  });
}

async function ensureParentProfile(userId: string) {
  const existing = await prisma.parentProfile.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.parentProfile.create({ data: { userId } });
  }
}

async function ensureStudentRecord(
  userId: string,
  demo: DemoUser,
  branchId: string
) {
  const gradeLevel = demo.gradeLevel ?? 0;
  const gradeBand = gradeLevelToBand(gradeLevel);

  const klass = await prisma.class.findFirst({
    where: { branchId, gradeLevel },
    orderBy: { name: "asc" },
  });

  let guardianId: string | null = null;
  if (demo.guardianEmail) {
    const guardianUser = await prisma.user.findUnique({
      where: { email: demo.guardianEmail.toLowerCase() },
      include: { parentProfile: true },
    });
    if (guardianUser?.parentProfile) {
      guardianId = guardianUser.parentProfile.id;
    }
  }

  const existing = await prisma.student.findFirst({ where: { userId } });
  const studentId =
    demo.studentCode ?? `STU-DEMO-${userId.slice(-4).toUpperCase()}`;

  if (existing) {
    await prisma.student.update({
      where: { id: existing.id },
      data: {
        firstName: demo.firstName,
        lastName: demo.lastName,
        branchId,
        classId: klass?.id ?? null,
        gradeLevel,
        gradeBand,
        stream: demo.stream ?? null,
        guardianId,
        isActive: true,
      },
    });
    try {
      await ensureSemesterPayment(existing.id, AcademicTerm.SEMESTER_1);
    } catch {
      // branch may lack academic year until seeded
    }
    return;
  }

  const created = await prisma.student.create({
    data: {
      userId,
      branchId,
      classId: klass?.id ?? null,
      studentId,
      firstName: demo.firstName,
      lastName: demo.lastName,
      gradeLevel,
      gradeBand,
      stream: demo.stream ?? null,
      guardianId,
      isActive: true,
    },
  });

  try {
    await ensureSemesterPayment(created.id, AcademicTerm.SEMESTER_1);
  } catch {
    // branch may lack academic year until seeded
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  for (const demo of DEMO_USERS) {
    const branchId = await resolveBranchId(demo);
    if (demo.branchCode && !branchId) {
      console.warn(`Skip ${demo.email}: branch ${demo.branchCode} not found`);
      continue;
    }

    const user = await prisma.user.upsert({
      where: { email: demo.email.toLowerCase() },
      create: {
        email: demo.email.toLowerCase(),
        passwordHash,
        firstName: demo.firstName,
        lastName: demo.lastName,
        role: demo.role,
        branchId,
        isActive: true,
        mustChangePassword: false,
        pendingOtp: null,
      },
      update: {
        passwordHash,
        firstName: demo.firstName,
        lastName: demo.lastName,
        isActive: true,
        mustChangePassword: false,
        pendingOtp: null,
        role: demo.role,
        branchId,
      },
    });

    if (branchId) {
      switch (demo.role) {
        case UserRole.TEACHER:
        case UserRole.FINANCE_OFFICER:
        case UserRole.LIBRARIAN:
          await ensureStaffProfile(user.id, branchId, demo.role, demo.department);
          break;
        case UserRole.PARENT:
          await ensureParentProfile(user.id);
          break;
        case UserRole.STUDENT:
          await ensureStudentRecord(user.id, demo, branchId);
          break;
      }
    }

    console.log(`✓ ${demo.email} (${demo.role}) — password: ${password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
