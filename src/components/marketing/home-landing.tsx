import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth/roles";
import { HomeLandingShell } from "@/components/marketing/home-landing-shell";

export async function HomeLanding() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  const dashboardHref = session?.user ? ROLE_HOME[session.user.role] : "/login";

  return <HomeLandingShell dashboardHref={dashboardHref} signedIn={signedIn} />;
}
