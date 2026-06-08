import { cn } from "@/lib/utils";

/**
 * Whole landing page — left/right padding + max content width (header → footer).
 * Change ONLY this line for horizontal layout. Bottom spacing is separate (pb-* on main).
 */
export const landingPageWrapClass =
  "mx-auto w-full max-w-7.5xl px-6 sm:px-8 lg:px-4";

export function MarketingEyebrow({
  children,
  className,
  centered,
}: {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
}) {
  if (centered) {
    return (
      <div className={cn("flex items-center justify-center gap-3 sm:gap-4", className)}>
        <span className="h-px w-8 bg-premium-accent/35 sm:w-12" aria-hidden />
        <p className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-premium-accent sm:text-[13px]">
          {children}
        </p>
        <span className="h-px w-8 bg-premium-accent/35 sm:w-12" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-10 bg-premium-accent" aria-hidden />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-premium-accent sm:text-[13px]">
        {children}
      </p>
    </div>
  );
}

export function MarketingSectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "mt-4 text-[1.875rem] font-bold leading-tight tracking-tight text-premium-ink sm:text-4xl sm:leading-tight",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function MarketingSectionLead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("mt-3 max-w-2xl text-base font-medium leading-relaxed text-premium-ink/65 sm:text-lg", className)}>
      {children}
    </p>
  );
}

export function MarketingSectionHeader({
  eyebrow,
  title,
  lead,
  centered,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  centered?: boolean;
}) {
  return (
    <div className={cn(centered && "mx-auto max-w-2xl text-center")}>
      <MarketingEyebrow centered={centered}>{eyebrow}</MarketingEyebrow>
      <MarketingSectionTitle className={cn(centered && "text-center")}>
        {title}
      </MarketingSectionTitle>
      {lead ? (
        <MarketingSectionLead className={cn(centered && "mx-auto text-center")}>
          {lead}
        </MarketingSectionLead>
      ) : null}
    </div>
  );
}
