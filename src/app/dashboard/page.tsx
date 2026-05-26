import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function DashboardRedirect() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  redirect(ROLE_HOME[session.user.role]);
}
