import type { UserRole } from "@prisma/client";

type ScopeUser = {
  role: UserRole;
  organizationId?: string | null;
};

/** Returns organizationId filter for tenant-scoped users, or undefined for global platform access. */
export function getOrganizationScope(user: ScopeUser): string | undefined {
  if (user.role === "PLATFORM_ADMIN") return undefined;
  if (user.role === "SUPER_ADMIN") return user.organizationId ?? undefined;
  if (user.organizationId) return user.organizationId;
  return undefined;
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === "PLATFORM_ADMIN";
}

export function canManagePlatform(role: UserRole): boolean {
  return role === "PLATFORM_ADMIN";
}

export function canManageOrganizationBranches(user: ScopeUser): boolean {
  return user.role === "SUPER_ADMIN" && Boolean(user.organizationId);
}

export function superAdminHasOrganization(user: ScopeUser): boolean {
  return user.role === "SUPER_ADMIN" && Boolean(user.organizationId);
}
