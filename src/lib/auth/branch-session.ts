import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireBranchAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== UserRole.BRANCH_ADMIN) redirect("/login");
  if (!session.user.branchId) redirect("/login");
  return {
    session,
    branchId: session.user.branchId,
    branchName: session.user.branchName ?? "Your branch",
  };
}
