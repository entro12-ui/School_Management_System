"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { canManageOrganizationBranches } from "@/lib/auth/organization-scope";
import { prisma } from "@/lib/prisma";
import { createOrganizationBranch } from "@/lib/services/platform-provisioning";

export type ActionResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function createSchoolBranch(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || !canManageOrganizationBranches(session.user)) {
    return { success: false, error: "Only your school super admin can add branches." };
  }

  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return { success: false, error: "Your account is not linked to a school organization." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !code || !city) {
    return { success: false, error: "Name, code, and city are required." };
  }

  try {
    await createOrganizationBranch({
      organizationId,
      name,
      code,
      city,
      address: address || undefined,
      phone: phone || undefined,
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create branch.",
    };
  }

  revalidatePath("/admin/branches");
  revalidatePath("/branch");

  return { success: true, message: `Branch "${name}" created.` };
}

export async function suspendOrganization(organizationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.PLATFORM_ADMIN) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { isActive: false },
  });

  revalidatePath("/platform/organizations");
  return { success: true, message: "School suspended." };
}

export async function activateOrganization(organizationId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.PLATFORM_ADMIN) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { isActive: true },
  });

  revalidatePath("/platform/organizations");
  return { success: true, message: "School reactivated." };
}
