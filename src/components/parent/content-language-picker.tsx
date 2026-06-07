"use client";

import { ContentLanguageDropdown } from "@/components/shared/content-language-dropdown";
import {
  PARENT_COMMUNICATION_CONTENT_LANGUAGES,
  PARENT_COMMUNICATION_CONTENT_LANGUAGE_LABELS,
  type ParentCommunicationContentLanguage,
} from "@/lib/parent-communication";
import { cn } from "@/lib/utils";

export function ContentLanguagePicker({
  value,
  onChange,
  compact = false,
}: {
  value: ParentCommunicationContentLanguage;
  onChange: (language: ParentCommunicationContentLanguage) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-slate-50/80",
        compact ? "px-3 py-2.5" : "px-4 py-3"
      )}
    >
      <p className="text-sm font-medium text-slate-900">Content language</p>
      {!compact ? (
        <p className="mt-0.5 text-xs text-slate-500">
          Draft subject and message body are written in the language you choose.
        </p>
      ) : null}
      <div className={cn(compact ? "mt-2" : "mt-3", compact && "max-w-xs")}>
        <ContentLanguageDropdown
          value={value}
          onChange={onChange}
          languages={PARENT_COMMUNICATION_CONTENT_LANGUAGES}
          labels={PARENT_COMMUNICATION_CONTENT_LANGUAGE_LABELS}
          ariaLabel="Content language"
          compact={compact}
          fullWidth={compact}
          variant="portal"
        />
      </div>
    </div>
  );
}
