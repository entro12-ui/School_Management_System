"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { BilingualContentLanguage } from "@/lib/content-language-display";
import { CONTENT_LANGUAGE_FLAGS } from "@/lib/content-language-display";
import { cn } from "@/lib/utils";

type ContentLanguageDropdownProps = {
  value: BilingualContentLanguage;
  onChange: (language: BilingualContentLanguage) => void;
  languages: readonly BilingualContentLanguage[];
  labels: Record<BilingualContentLanguage, string>;
  ariaLabel: string;
  compact?: boolean;
  fullWidth?: boolean;
  variant?: "marketing" | "portal";
};

export function ContentLanguageDropdown({
  value,
  onChange,
  languages,
  labels,
  ariaLabel,
  compact = false,
  fullWidth = false,
  variant = "marketing",
}: ContentLanguageDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const isMarketing = variant === "marketing";

  return (
    <div
      ref={rootRef}
      className={cn("relative", fullWidth && "w-full")}
    >
      <button
        type="button"
        id={`${listboxId}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
          fullWidth && "w-full justify-between",
          compact ? "px-2.5 py-2 text-xs" : "px-3 py-2 text-sm",
          isMarketing
            ? "border-premium-ink/10 bg-white text-premium-ink hover:border-premium-accent/30 hover:bg-premium-accent/5 focus-visible:ring-premium-accent/40"
            : "border-slate-200 bg-white text-slate-800 hover:border-indigo-200 hover:bg-indigo-50/50 focus-visible:ring-indigo-500/40"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="text-base leading-none" aria-hidden>
            {CONTENT_LANGUAGE_FLAGS[value]}
          </span>
          <span className="truncate">{labels[value]}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-60 transition-transform",
            open && "rotate-180",
            isMarketing ? "text-premium-ink/50" : "text-slate-500"
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={`${listboxId}-trigger`}
          className={cn(
            "absolute z-50 mt-1.5 min-w-full overflow-hidden rounded-lg border py-1 shadow-lg",
            fullWidth ? "left-0 right-0" : "left-0 w-max min-w-[10.5rem]",
            isMarketing
              ? "border-premium-ink/10 bg-white shadow-[var(--shadow-premium-md)]"
              : "border-slate-200 bg-white shadow-md"
          )}
        >
          {languages.map((option) => {
            const selected = value === option;
            return (
              <li key={option} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition",
                    selected
                      ? isMarketing
                        ? "bg-premium-accent/10 font-semibold text-premium-accent"
                        : "bg-indigo-50 font-semibold text-indigo-700"
                      : isMarketing
                        ? "text-premium-ink/80 hover:bg-premium-canvas"
                        : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {CONTENT_LANGUAGE_FLAGS[option]}
                  </span>
                  <span className="flex-1">{labels[option]}</span>
                  {selected ? (
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isMarketing ? "text-premium-accent" : "text-indigo-600"
                      )}
                      strokeWidth={2.5}
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
