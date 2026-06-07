import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  className,
}: {
  name?: string | null;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name ? `${name} profile photo` : "Profile photo"}
        width={size === "lg" ? 48 : size === "sm" ? 32 : 40}
        height={size === "lg" ? 48 : size === "sm" ? 32 : 40}
        className={cn("rounded-full object-cover ring-2 ring-white", sizeClass, className)}
        unoptimized
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-premium-accent font-semibold text-white ring-2 ring-white",
        sizeClass,
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
