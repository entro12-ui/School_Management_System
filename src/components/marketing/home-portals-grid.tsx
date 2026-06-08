"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Crown,
  GraduationCap,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const BRANCH_ICONS = [Shield, ClipboardList, GraduationCap, Wallet, BookOpen, Users] as const;

export function HomePortalsGrid() {
  const { content } = useLandingLanguage();
  const { portals } = content;

  return (
    <section id="portals" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={portals.eyebrow}
        title={portals.title}
        lead={portals.lead}
        centered
      />

      <div className="mt-10">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-premium-ink/40">
          {portals.centralOfficeHeading}
        </p>
        <PortalCard
          label={portals.central.label}
          description={portals.central.description}
          href="/login"
          icon={Crown}
        />
      </div>

      <div className="mt-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-premium-ink/40">
          {portals.branchStaffHeading}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {portals.branchStaff.map((role, index) => (
            <PortalCard
              key={role.label}
              label={role.label}
              description={role.description}
              href="/login"
              icon={BRANCH_ICONS[index] ?? Users}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-premium-ink/40">
          {portals.familiesHeading}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {portals.family.map((role, index) => (
            <PortalCard
              key={role.label}
              label={role.label}
              description={role.description}
              href="/login"
              icon={index === 1 ? GraduationCap : Users}
            />
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-premium-ink/50">
        {portals.registerPrefix}{" "}
        <Link href="/register" className="font-medium text-premium-accent hover:underline">
          {portals.registerLink}
        </Link>
      </p>
    </section>
  );
}

function PortalCard({
  label,
  description,
  href,
  icon: Icon,
}: {
  label: string;
  description: string;
  href: string;
  icon?: typeof Users;
}) {
  const IconComponent = Icon ?? Users;
  return (
    <Link href={href} className="marketing-card group block !p-4">
      <div className="flex items-start gap-3.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-premium-accent/10 text-premium-accent transition group-hover:bg-premium-accent group-hover:text-white">
          <IconComponent className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-premium-ink">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-premium-ink/50">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-premium-ink/20 transition group-hover:text-premium-accent" />
      </div>
    </Link>
  );
}
