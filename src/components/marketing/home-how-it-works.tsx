"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Crown,
  GraduationCap,
  Layers,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { MarketingSectionHeader } from "@/components/marketing/marketing-primitives";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";

const STAFF_ICONS = [Shield, ClipboardList, GraduationCap, Wallet, BookOpen, Users] as const;

export function HomeHowItWorks() {
  const { content } = useLandingLanguage();
  const { structure } = content;

  return (
    <section id="organization" className="scroll-mt-28 mt-24 sm:mt-28">
      <MarketingSectionHeader
        eyebrow={structure.eyebrow}
        title={structure.title}
        lead={structure.lead}
      />

      <div className="mt-12 space-y-4">
        <div className="marketing-card !p-6 sm:!p-8">
          <div className="flex items-start gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-premium-accent text-white">
              <Crown className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-premium-ink/45">
                {structure.centralOffice.subtitle}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-premium-ink">
                {structure.centralOffice.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-premium-ink/65">
                {structure.centralOffice.description}
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {structure.centralOffice.capabilities.map((capability) => (
                  <li
                    key={capability}
                    className="rounded-md border border-premium-ink/8 bg-premium-canvas/80 px-2.5 py-1 text-xs font-medium text-premium-ink/75"
                  >
                    {capability}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-center py-1" aria-hidden>
          <ArrowDown className="h-4 w-4 text-premium-ink/20" />
        </div>

        <div className="marketing-card !p-6 sm:!p-8">
          <div className="mb-5 flex items-center gap-2.5">
            <Layers className="h-4 w-4 text-premium-accent" strokeWidth={1.75} />
            <h3 className="font-semibold text-premium-ink">{structure.branchStaffHeading}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {structure.branchStaffLabels.map((label, index) => {
              const Icon = STAFF_ICONS[index] ?? Users;
              return (
                <div
                  key={label}
                  className="inline-flex items-center gap-2.5 rounded-lg border border-premium-ink/8 bg-premium-canvas/50 px-3 py-2"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-premium-accent text-white">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </div>
                  <span className="text-sm font-medium text-premium-ink">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="marketing-card !p-5">
            <h3 className="font-semibold text-premium-ink">{structure.gradeBandsHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-premium-ink/65">
              {structure.academicLayers.map((layer) => (
                <li key={layer.label}>
                  <span className="font-medium text-premium-ink">{layer.label}</span> — {layer.detail}
                </li>
              ))}
            </ul>
          </div>
          <div className="marketing-card !p-5">
            <h3 className="font-semibold text-premium-ink">{structure.familyPortalsHeading}</h3>
            <ul className="mt-3 space-y-2">
              {structure.familyRoles.map((role) => (
                <li key={role.label} className="text-sm text-premium-ink/65">
                  <span className="font-medium text-premium-ink">{role.label}</span> —{" "}
                  {role.description}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-premium-ink/50">
        {structure.orgMapPrefix}{" "}
        <Link href="/login" className="font-medium text-premium-accent hover:underline">
          {structure.orgMapLink}
        </Link>
        <ArrowRight className="ml-0.5 inline h-3.5 w-3.5" />
      </p>
    </section>
  );
}
