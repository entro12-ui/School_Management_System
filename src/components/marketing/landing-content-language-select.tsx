"use client";

import { Languages } from "lucide-react";
import { ContentLanguageDropdown } from "@/components/shared/content-language-dropdown";
import {
  LANDING_CONTENT_LANGUAGES,
  LANDING_CONTENT_LANGUAGE_LABELS,
  type LandingContentLanguage,
} from "@/lib/marketing/landing-content";
import { useLandingLanguage } from "@/lib/marketing/landing-language-context";
import { cn } from "@/lib/utils";

export function LandingContentLanguageSelect({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, content } = useLandingLanguage();

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact ? "flex-wrap" : "landing-lang-pill rounded-xl px-2 py-1.5"
      )}
    >
      {!compact ? (
        <span className="hidden items-center gap-1.5 pl-1 text-[11px] font-semibold tracking-wide text-premium-ink/60 uppercase xl:flex">
          <Languages className="h-3.5 w-3.5 text-premium-accent" aria-hidden />
          {content.header.contentLanguageLabel}
        </span>
      ) : (
        <Languages className="h-4 w-4 shrink-0 text-premium-accent" aria-hidden />
      )}
      <ContentLanguageDropdown
        value={language}
        onChange={setLanguage}
        languages={LANDING_CONTENT_LANGUAGES}
        labels={LANDING_CONTENT_LANGUAGE_LABELS}
        ariaLabel={content.header.contentLanguageLabel}
        compact={compact}
        fullWidth={compact}
        variant="marketing"
      />
    </div>
  );
}

export type { LandingContentLanguage };
