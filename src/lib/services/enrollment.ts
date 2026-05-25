import bcrypt from "bcryptjs";
import {
  AcademicTerm,
  GradeBand,
  RegistrationRole,
  SeniorStream,
  UserRole,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateOneTimePassword } from "@/lib/otp";
import { ensureSemesterPayment } from "@/lib/semester-fees";
import { provisionHrEmployeeForUser } from "@/lib/services/hr-employee-provision";

export type EnrollableRole = Exclude<UserRole, "SUPER_ADMIN">;

export type EnrollUserInput = {
  branchId: string;
  role: EnrollableRole;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: string;
  gradeLevel?: number;
  gradeBand?: GradeBand;
  stream?: SeniorStream;
  guardianName?: string;
  guardianPhone?: string;
  department?: string;
  subjectIds?: string[];
  /** When role is HR_OFFICER, grant full HR Manager RBAC (default true). */
  asHrManager?: boolean;
};

export type EnrollUserResult = {
  userId: string;
  email: string;
  oneTimePassword: string;
  studentId?: string;
};

function staffPrefix(role: EnrollableRole): string | null {
  switch (role) {
    case UserRole.TEACHER:
      return "T";
    case UserRole.FINANCE_OFFICER:
      return "F";
    case UserRole.LIBRARIAN:
      return "L";
    default:
      return null;
  }
}

async function generateStudentId(
  db: Prisma.TransactionClient,
  branchId: string,
  branchCode: string
) {
  const year = new Date().getFullYear();
  const code = branchCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "BR";
  const prefix = `STU-${code}-${year}`;
  const existingCount = await db.student.count({ where: { branchId } });

  for (let i = existingCount + 1; i < existingCount + 10000; i += 1) {
    const candidate = `${prefix}-${String(i).padStart(4, "0")}`;
    const existing = await db.student.findUnique({
      where: { branchId_studentId: { branchId, studentId: candidate } },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  throw new Error("Could not generate a unique student ID. Please try again.");
}

export async function createEnrolledUser(
  input: EnrollUserInput,
  tx?: Prisma.TransactionClient
): Promise<EnrollUserResult> {
  const db = tx ?? prisma;
  const email = input.email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const branch = await db.branch.findUniqueOrThrow({
    where: { id: input.branchId },
  });

  const oneTimePassword = generateOneTimePassword();
  const passwordHash = await bcrypt.hash(oneTimePassword, 10);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() || null,
      role: input.role,
      branchId: input.branchId,
      isActive: true,
      mustChangePassword: true,
      pendingOtp: oneTimePassword,
      otpIssuedAt: new Date(),
    },
  });

  let generatedStudentId: string | undefined;

  if (input.role === UserRole.STUDENT) {
    generatedStudentId = await generateStudentId(
      db as Prisma.TransactionClient,
      input.branchId,
      branch.code
    );
    const student = await db.student.create({
      data: {
        userId: user.id,
        branchId: input.branchId,
        studentId: generatedStudentId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        dateOfBirth: input.dateOfBirth ?? null,
        gender: input.gender ?? null,
        gradeLevel: input.gradeLevel ?? 0,
        gradeBand: input.gradeBand ?? GradeBand.KG,
        stream: input.stream ?? null,
      },
    });

    try {
      await ensureSemesterPayment(student.id, AcademicTerm.SEMESTER_1, db);
    } catch {
      // Academic year or fee structure may be missing until branch is fully configured
    }
  } else if (input.role === UserRole.PARENT) {
    await db.parentProfile.create({ data: { userId: user.id } });
  } else if (
    input.role === UserRole.REGISTRAR ||
    input.role === UserRole.BRANCH_ADMIN
  ) {
    // Portal account only — no StaffProfile / HrEmployee row required.
  } else if (input.role === UserRole.HR_OFFICER) {
    const run = async (client: Prisma.TransactionClient) => {
      await provisionHrEmployeeForUser(client, {
        userId: user.id,
        branchId: input.branchId,
        email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        asHrManager: input.asHrManager,
      });
    };
    if (tx) {
      await run(tx);
    } else {
      await prisma.$transaction(run);
    }
  } else {
    const prefix = staffPrefix(input.role);
    if (!prefix) {
      throw new Error(`Unsupported staff role: ${input.role}`);
    }
    const staffCount = await db.staffProfile.count({
      where: { branchId: input.branchId },
    });
    const staff = await db.staffProfile.create({
      data: {
        userId: user.id,
        branchId: input.branchId,
        employeeId: `${prefix}-${branch.code}-${String(staffCount + 1).padStart(4, "0")}`,
        department: input.department ?? null,
        hireDate: new Date(),
      },
    });

    if (input.role === UserRole.TEACHER && input.subjectIds?.length) {
      await db.staffSubject.createMany({
        data: input.subjectIds.map((subjectId) => ({
          staffId: staff.id,
          subjectId,
        })),
        skipDuplicates: true,
      });
      await db.subject.update({
        where: { id: input.subjectIds[0] },
        data: { teacherId: staff.id },
      });
    }
  }

  return { userId: user.id, email, oneTimePassword, studentId: generatedStudentId };
}

export async function createRegistrarFromApproval(
  request: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    branchId: string;
  },
  tx: Prisma.TransactionClient
): Promise<EnrollUserResult> {
  const email = request.email.toLowerCase().trim();
  const oneTimePassword = generateOneTimePassword();
  const passwordHash = await bcrypt.hash(oneTimePassword, 10);

  const user = await tx.user.create({
    data: {
      email,
      passwordHash,
      firstName: request.firstName,
      lastName: request.lastName,
      phone: request.phone,
      role: UserRole.REGISTRAR,
      branchId: request.branchId,
      isActive: true,
      mustChangePassword: true,
      pendingOtp: oneTimePassword,
      otpIssuedAt: new Date(),
    },
  });

  return { userId: user.id, email, oneTimePassword };
}

export function mapRegistrationRoleToUserRole(
  role: RegistrationRole
): UserRole | null {
  if (role === RegistrationRole.REGISTRAR) return UserRole.REGISTRAR;
  return null;
}
