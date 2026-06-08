"use client";

import { Instrument_Serif } from "next/font/google";
import { HomeHeader } from "@/components/marketing/home-header";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomeStatsBar } from "@/components/marketing/home-stats-bar";
import { HomeTrustStrip } from "@/components/marketing/home-trust-strip";
import { HomePortalDemos } from "@/components/marketing/home-portal-demos";
import { HomePlatformShowcase } from "@/components/marketing/home-platform-showcase";
import { HomeHelpfulTools } from "@/components/marketing/home-helpful-tools";
import { HomePlatformCoverage } from "@/components/marketing/home-platform-coverage";
import { HomeHowItWorks } from "@/components/marketing/home-how-it-works";
import { HomeWorkflowSteps } from "@/components/marketing/home-workflow-steps";
import { HomePortalsGrid } from "@/components/marketing/home-portals-grid";
import { HomePrograms } from "@/components/marketing/home-programs";
import { HomeFeatures } from "@/components/marketing/home-features";
import { HomePricing } from "@/components/marketing/home-pricing";
import { HomeFaq } from "@/components/marketing/home-faq";
import { HomeCta, HomeFooter } from "@/components/marketing/home-cta-footer";
import { LandingLanguageProvider } from "@/lib/marketing/landing-language-context";
import { landingPageWrapClass } from "@/components/marketing/marketing-primitives";
import { cn } from "@/lib/utils";

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

export function HomeLandingShell({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string;
  signedIn: boolean;
}) {
  return (
    <LandingLanguageProvider>
      <div className={cn("min-h-screen bg-premium-canvas", display.variable)}>
        {/* Header / hero / main / footer share landingPageWrapClass — see marketing-primitives.tsx */}
        <HomeHeader dashboardHref={dashboardHref} signedIn={signedIn} />

        <HomeHero dashboardHref={dashboardHref} signedIn={signedIn} />

        <main className={cn(landingPageWrapClass, "pb-20")}>
          <HomeStatsBar />
          <HomeTrustStrip />
          <HomePortalDemos />
          <HomePlatformShowcase />
          <HomeWorkflowSteps />
          <HomeHelpfulTools />
          <HomePlatformCoverage />
          <HomeHowItWorks />
          <HomePortalsGrid />
          <HomePrograms />
          <HomeFeatures />
          <HomePricing />
          <HomeFaq />
          <HomeCta dashboardHref={dashboardHref} />
        </main>
        <HomeFooter />
      </div>
    </LandingLanguageProvider>
  );
}
