import { cn } from "@/lib/utils";

export function MarketingEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-10 bg-premium-accent" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-premium-accent">
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
        "mt-4 text-3xl font-semibold tracking-tight text-premium-ink sm:text-[2.125rem] sm:leading-tight",
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
    <p className={cn("mt-3 max-w-2xl text-base leading-relaxed text-premium-ink/65", className)}>
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
      <MarketingEyebrow className={cn(centered && "justify-center")}>{eyebrow}</MarketingEyebrow>
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
