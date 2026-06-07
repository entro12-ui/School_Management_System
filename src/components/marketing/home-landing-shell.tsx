"use client";

import { HomeHeader } from "@/components/marketing/home-header";
import { HomeHero } from "@/components/marketing/home-hero";
import { HomePlatformShowcase } from "@/components/marketing/home-platform-showcase";
import { HomeAiCapabilities } from "@/components/marketing/home-ai-capabilities";
import { HomeHowItWorks } from "@/components/marketing/home-how-it-works";
import { HomePortalsGrid } from "@/components/marketing/home-portals-grid";
import { HomePrograms } from "@/components/marketing/home-programs";
import { HomeFeatures } from "@/components/marketing/home-features";
import { HomePricing } from "@/components/marketing/home-pricing";
import { HomeCta, HomeFooter } from "@/components/marketing/home-cta-footer";
import { LandingLanguageProvider } from "@/lib/marketing/landing-language-context";

export function HomeLandingShell({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string;
  signedIn: boolean;
}) {
  return (
    <LandingLanguageProvider>
      <div className="min-h-screen bg-premium-canvas">
        <HomeHeader dashboardHref={dashboardHref} signedIn={signedIn} />

        <main className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="pt-8 sm:pt-12">
            <HomeHero dashboardHref={dashboardHref} signedIn={signedIn} />
            <HomePlatformShowcase />
            <HomeAiCapabilities />
            <HomeHowItWorks />
            <HomePortalsGrid />
            <HomePrograms />
            <HomeFeatures />
            <HomePricing />
            <HomeCta dashboardHref={dashboardHref} />
            <HomeFooter />
          </div>
        </main>
      </div>
    </LandingLanguageProvider>
  );
}
