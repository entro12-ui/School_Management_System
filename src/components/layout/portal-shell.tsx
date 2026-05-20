import { auth } from "@/lib/auth";
import { signOutUser } from "@/lib/actions/auth";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { PortalLayout } from "./portal-layout";
import type { NavItemConfig } from "@/lib/nav/icons";

interface PortalShellProps {
  title: string;
  subtitle?: string;
  nav: NavItemConfig[];
  children: React.ReactNode;
}

export async function PortalShell({
  title,
  subtitle,
  nav,
  children,
}: PortalShellProps) {
  const session = await auth();
  const user = session?.user;

  return (
    <PortalLayout
      title={title}
      subtitle={subtitle}
      nav={nav}
      userName={user?.name}
      userRole={user ? ROLE_LABELS[user.role] : undefined}
      branchName={user?.branchName}
      userPhotoUrl={user?.photoUrl}
      signOutAction={signOutUser}
    >
      {children}
    </PortalLayout>
  );
}
