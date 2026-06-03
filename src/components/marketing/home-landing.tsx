import { auth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/auth/roles";
import { HomeHeader } from "@/components/marketing/home-header";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeHowItWorks } from "@/components/marketing/home-how-it-works";
import { HomePortalsGrid } from "@/components/marketing/home-portals-grid";
import { HomePrograms } from "@/components/marketing/home-programs";
import { HomeFeatures } from "@/components/marketing/home-features";
import { HomeCta, HomeFooter } from "@/components/marketing/home-cta-footer";
import { HomePlatformShowcase } from "@/components/marketing/home-platform-showcase";

export async function HomeLanding() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  const dashboardHref = session?.user ? ROLE_HOME[session.user.role] : "/login";

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-indigo-50/80">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-violet-400/20 blur-[100px]" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-cyan-400/15 blur-[80px]" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-400/10 blur-[90px]" />
        <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-amber-300/20 blur-[70px]" />
        <div className="absolute bottom-32 left-10 h-56 w-56 rounded-full bg-rose-300/15 blur-[60px]" />
      </div>

      <HomeHeader dashboardHref={dashboardHref} signedIn={signedIn} />

      <main className="relative mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="pt-8 sm:pt-12">
          <HomeHero dashboardHref={dashboardHref} signedIn={signedIn} />
          <HomePlatformShowcase />
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
