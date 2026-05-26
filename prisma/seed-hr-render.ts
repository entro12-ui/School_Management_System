/**
 * Seed HR module on Render only (safe to run on production DB).
 * Run: npm run db:seed-hr-render
 */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash() {
  return bcrypt.hash(process.env.SEED_PASSWORD ?? "demo1234", 10);
}

async function main() {
  const branch = await prisma.branch.findFirst({ where: { code: "ADDIS-01" } });
  if (!branch) {
    console.error("No ADDIS-01 branch on Render. Run full seed or create branches first.");
    process.exit(1);
  }

  const existingHr = await prisma.user.findUnique({
    where: { email: "hr.addis@school.et" },
  });

  let hrUserId = existingHr?.id;

  if (!existingHr) {
    const user = await prisma.user.create({
      data: {
        email: "hr.addis@school.et",
        passwordHash: await hash(),
        firstName: "Selam",
        lastName: "Tadesse",
        role: UserRole.HR_OFFICER,
        branchId: branch.id,
      },
    });
    hrUserId = user.id;
    console.log("Created HR user:", user.email);
  } else {
    if (existingHr.role !== UserRole.HR_OFFICER) {
      await prisma.user.update({
        where: { id: existingHr.id },
        data: { role: UserRole.HR_OFFICER },
      });
    }
    console.log("HR user already exists:", existingHr.email);
  }

  const deptCount = await prisma.hrDepartment.count({
    where: { branchId: branch.id },
  });

  if (deptCount === 0) {
    const deptAdmin = await prisma.hrDepartment.create({
      data: {
        branchId: branch.id,
        name: "Administration",
        description: "School office and operations",
      },
    });
    const deptAcademic = await prisma.hrDepartment.create({
      data: {
        branchId: branch.id,
        name: "Academic",
        description: "Teaching staff support",
      },
    });

    const desigManager = await prisma.hrDesignation.create({
      data: { branchId: branch.id, title: "HR Manager", salaryGrade: "G7" },
    });
    const desigOfficer = await prisma.hrDesignation.create({
      data: { branchId: branch.id, title: "HR Officer", salaryGrade: "G5" },
    });

    await prisma.hrLeaveType.createMany({
      data: [
        { branchId: branch.id, name: "Annual leave", maxDays: 20 },
        { branchId: branch.id, name: "Sick leave", maxDays: 10 },
      ],
    });

    await prisma.hrEmployee.create({
      data: {
        branchId: branch.id,
        departmentId: deptAdmin.id,
        designationId: desigManager.id,
        employeeCode: "HR-001",
        firstName: "Selam",
        lastName: "Tadesse",
        email: "hr.addis@school.et",
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        userId: hrUserId!,
      },
    });

    await prisma.hrEmployee.create({
      data: {
        branchId: branch.id,
        departmentId: deptAcademic.id,
        designationId: desigOfficer.id,
        employeeCode: "HR-002",
        firstName: "Daniel",
        lastName: "Mekonnen",
        email: "daniel.hr@school.et",
        employmentType: "FULL_TIME",
        status: "ACTIVE",
      },
    });

    console.log("Created HR departments, designations, and sample employees.");
  } else {
    console.log("HR departments already exist — skipped sample data.");
  }

  const hrManagerRole = await prisma.hrRole.upsert({
    where: { name: "HR Manager" },
    create: { name: "HR Manager", description: "Full control of HR module" },
    update: {},
  });

  if (hrUserId) {
    await prisma.hrUserRole.upsert({
      where: { userId_roleId: { userId: hrUserId, roleId: hrManagerRole.id } },
      create: { userId: hrUserId, roleId: hrManagerRole.id },
      update: {},
    });
  }

  console.log("✓ HR seed on Render complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
