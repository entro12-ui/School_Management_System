import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth/roles";
import { HomeHeader } from "@/components/marketing/home-header";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeHowItWorks } from "@/components/marketing/home-how-it-works";
import { HomePortalsGrid } from "@/components/marketing/home-portals-grid";
import { HomePrograms } from "@/components/marketing/home-programs";
import { HomeFeatures } from "@/components/marketing/home-features";
import { HomeCta, HomeFooter } from "@/components/marketing/home-cta-footer";

export async function HomeLanding() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  const dashboardHref = session?.user ? ROLE_HOME[session.user.role] : "/login";

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-40 top-0 h-[28rem] w-[28rem] rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-100/40 blur-3xl" />
      </div>

      <HomeHeader dashboardHref={dashboardHref} signedIn={signedIn} />

      <main className="relative mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="pt-10 sm:pt-14">
          <HomeHero dashboardHref={dashboardHref} signedIn={signedIn} />
          <HomeHowItWorks />
          <HomePortalsGrid />
          <HomePrograms />
          <HomeFeatures />
          <HomeCta dashboardHref={dashboardHref} />
          <HomeFooter />
        </div>
      </main>
    </div>
  );
}
