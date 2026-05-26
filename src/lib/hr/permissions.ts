/** In-app HR RBAC permission keys (HrPermission.name). */
export const HR_PERMISSIONS = {
  EMPLOYEES_READ: "employees.read",
  EMPLOYEES_WRITE: "employees.write",
  DEPARTMENTS_WRITE: "departments.write",
  LEAVE_READ: "leave.read",
  LEAVE_WRITE: "leave.write",
  LEAVE_APPROVE: "leave.approve",
  ATTENDANCE_WRITE: "attendance.write",
  PAYROLL_READ: "payroll.read",
  PAYROLL_WRITE: "payroll.write",
  PAYROLL_RUN: "payroll.run",
  PERFORMANCE_WRITE: "performance.write",
  TRAINING_WRITE: "training.write",
  ASSETS_WRITE: "assets.write",
  RECRUITMENT_WRITE: "recruitment.write",
  ROLES_MANAGE: "roles.manage",
} as const;

export type HrPermissionName =
  (typeof HR_PERMISSIONS)[keyof typeof HR_PERMISSIONS];

export const ALL_HR_PERMISSIONS: HrPermissionName[] = Object.values(HR_PERMISSIONS);

export const HR_MANAGER_ROLE_NAME = "HR Manager";
