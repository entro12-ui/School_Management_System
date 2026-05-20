import type { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { generateHrEmployeeCode } from "@/lib/hr/employee-code";
import { HR_MANAGER_ROLE_NAME } from "@/lib/hr/permissions";
import {
  resolveDepartmentIdForRole,
  resolveDesignationId,
} from "@/lib/hr/staff-designations";
import { ensureHrRbacDefaults } from "@/lib/services/hr";

export async function provisionHrEmployeeForUser(
  db: Prisma.TransactionClient,
  input: {
    userId: string;
    branchId: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    asHrManager?: boolean;
  }
): Promise<void> {
  await ensureHrRbacDefaults();

  const email = input.email.toLowerCase().trim();
  const asHrManager = input.asHrManager !== false;
  const designationTitle = asHrManager ? "HR Manager" : "HR Officer";

  const employeeCode = await generateHrEmployeeCode(
    input.branchId,
    UserRole.HR_OFFICER
  );
  const departmentId = await resolveDepartmentIdForRole(
    input.branchId,
    UserRole.HR_OFFICER
  );
  const designationId = await resolveDesignationId(
    input.branchId,
    designationTitle
  );

  await db.hrEmployee.create({
    data: {
      branchId: input.branchId,
      departmentId,
      designationId,
      userId: input.userId,
      employeeCode,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: input.phone?.trim() || null,
      employmentType: "FULL_TIME",
      status: "ACTIVE",
      joiningDate: new Date(),
    },
  });

  if (asHrManager) {
    const managerRole = await db.hrRole.findUnique({
      where: { name: HR_MANAGER_ROLE_NAME },
    });
    if (managerRole) {
      await db.hrUserRole.create({
        data: { userId: input.userId, roleId: managerRole.id },
      });
    }
  }
}
