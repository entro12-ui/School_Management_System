import { cn } from "@/lib/utils";

export type HeroIllustrationId =
  | "attendance"
  | "parents"
  | "classroom"
  | "grades"
  | "finance";

const illustrationClass = "block h-full w-full";

export function HeroIllustration({
  id,
  className,
  title,
}: {
  id: HeroIllustrationId;
  className?: string;
  title: string;
}) {
  const props = {
    className: cn(illustrationClass, className),
    viewBox: "0 0 320 240",
    fill: "none" as const,
    xmlns: "http://www.w3.org/2000/svg",
    role: "img" as const,
    "aria-label": title,
  };

  switch (id) {
    case "attendance":
      return (
        <svg {...props}>
          <rect width="320" height="240" rx="16" fill="#f7f5f0" />
          <rect x="16" y="16" width="288" height="208" rx="12" fill="#fff" stroke="#0c1222" strokeOpacity="0.08" />
          <rect x="28" y="28" width="120" height="10" rx="5" fill="#0e7268" fillOpacity="0.15" />
          <rect x="28" y="46" width="80" height="8" rx="4" fill="#0c1222" fillOpacity="0.12" />
          <rect x="28" y="72" width="264" height="1" fill="#0c1222" fillOpacity="0.06" />
          <text x="28" y="96" fill="#0c1222" fillOpacity="0.55" fontFamily="system-ui,sans-serif" fontSize="11">
            Grade 8B · Homeroom
          </text>
          <rect x="28" y="108" width="264" height="28" rx="8" fill="#e8f3f1" />
          <circle cx="44" cy="122" r="6" fill="#0e7268" />
          <path d="M41 122l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="58" y="116" width="100" height="6" rx="3" fill="#0c1222" fillOpacity="0.2" />
          <rect x="58" y="126" width="60" height="5" rx="2.5" fill="#0c1222" fillOpacity="0.1" />
          <text x="240" y="126" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600">
            Present
          </text>
          <rect x="28" y="144" width="264" height="28" rx="8" fill="#fff" stroke="#0c1222" strokeOpacity="0.06" />
          <circle cx="44" cy="158" r="6" fill="#0e7268" />
          <path d="M41 158l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="58" y="152" width="90" height="6" rx="3" fill="#0c1222" fillOpacity="0.2" />
          <text x="240" y="162" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600">
            Present
          </text>
          <rect x="28" y="180" width="264" height="28" rx="8" fill="#fff" stroke="#f59e0b" strokeOpacity="0.35" />
          <circle cx="44" cy="194" r="6" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="58" y="188" width="110" height="6" rx="3" fill="#0c1222" fillOpacity="0.2" />
          <text x="232" y="198" fill="#d97706" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600">
            Absent
          </text>
        </svg>
      );
    case "parents":
      return (
        <svg {...props}>
          <rect width="320" height="240" rx="16" fill="#f7f5f0" />
          <rect x="96" y="16" width="128" height="208" rx="20" fill="#0c1222" fillOpacity="0.92" />
          <rect x="104" y="28" width="112" height="188" rx="14" fill="#fff" />
          <rect x="120" y="44" width="80" height="8" rx="4" fill="#0e7268" fillOpacity="0.2" />
          <rect x="120" y="60" width="56" height="6" rx="3" fill="#0c1222" fillOpacity="0.1" />
          <rect x="120" y="80" width="80" height="48" rx="12" fill="#e8f3f1" />
          <text x="128" y="100" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="600">
            Fee reminder
          </text>
          <text x="128" y="114" fill="#0c1222" fillOpacity="0.6" fontFamily="system-ui,sans-serif" fontSize="8">
            Semester 2 · Due Fri
          </text>
          <rect x="120" y="136" width="80" height="48" rx="12" fill="#f3efe6" />
          <text x="128" y="156" fill="#0c1222" fillOpacity="0.7" fontFamily="system-ui,sans-serif" fontSize="8">
            Amharic draft
          </text>
          <text x="128" y="170" fill="#0c1222" fillOpacity="0.5" fontFamily="system-ui,sans-serif" fontSize="7">
            Ready to review
          </text>
          <rect x="120" y="192" width="80" height="16" rx="8" fill="#0e7268" />
          <text x="134" y="203" fill="#fff" fontFamily="system-ui,sans-serif" fontSize="8" fontWeight="600">
            Review &amp; send
          </text>
          <circle cx="56" cy="120" r="28" fill="#e8f3f1" stroke="#0e7268" strokeOpacity="0.2" strokeWidth="2" />
          <circle cx="56" cy="108" r="10" fill="#0e7268" fillOpacity="0.3" />
          <path d="M36 138c4-8 12-12 20-12s16 4 20 12" stroke="#0e7268" strokeOpacity="0.4" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "classroom":
      return (
        <svg {...props}>
          <rect width="320" height="240" rx="16" fill="#f7f5f0" />
          <rect x="16" y="24" width="288" height="120" rx="10" fill="#e8f3f1" />
          <rect x="32" y="40" width="160" height="88" rx="6" fill="#fff" stroke="#0e7268" strokeOpacity="0.25" />
          <rect x="44" y="52" width="80" height="6" rx="3" fill="#0e7268" fillOpacity="0.3" />
          <rect x="44" y="64" width="120" height="4" rx="2" fill="#0c1222" fillOpacity="0.1" />
          <rect x="44" y="74" width="100" height="4" rx="2" fill="#0c1222" fillOpacity="0.1" />
          <circle cx="220" cy="84" r="24" fill="#0e7268" fillOpacity="0.15" />
          <circle cx="220" cy="72" r="10" fill="#0e7268" fillOpacity="0.35" />
          <path d="M200 98c6-10 16-14 20-14s14 4 20 14" stroke="#0e7268" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
          <circle cx="76" cy="178" r="10" fill="#0e7268" fillOpacity="0.35" />
          <circle cx="160" cy="182" r="9" fill="#0c1222" fillOpacity="0.2" />
          <circle cx="244" cy="178" r="10" fill="#0e7268" fillOpacity="0.35" />
          <rect x="16" y="152" width="288" height="64" rx="10" fill="#fff" stroke="#0c1222" strokeOpacity="0.06" />
          <rect x="28" y="164" width="72" height="8" rx="4" fill="#0e7268" fillOpacity="0.2" />
          <rect x="220" y="168" width="72" height="24" rx="8" fill="#0e7268" />
          <text x="232" y="184" fill="#fff" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="600">
            Mark entry
          </text>
        </svg>
      );
    case "grades":
      return (
        <svg {...props}>
          <rect width="320" height="240" rx="16" fill="#f7f5f0" />
          <rect x="40" y="20" width="240" height="200" rx="10" fill="#fff" stroke="#0c1222" strokeOpacity="0.1" transform="rotate(-2 160 120)" />
          <rect x="56" y="36" width="208" height="168" rx="6" fill="#fff" stroke="#0e7268" strokeOpacity="0.2" />
          <rect x="72" y="52" width="80" height="10" rx="5" fill="#0e7268" />
          <rect x="72" y="68" width="120" height="7" rx="3.5" fill="#0c1222" fillOpacity="0.12" />
          <rect x="72" y="88" width="176" height="1" fill="#0c1222" fillOpacity="0.08" />
          <text x="72" y="108" fill="#0c1222" fillOpacity="0.5" fontFamily="system-ui,sans-serif" fontSize="10">
            Mathematics
          </text>
          <text x="220" y="108" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="700">
            A
          </text>
          <text x="72" y="128" fill="#0c1222" fillOpacity="0.5" fontFamily="system-ui,sans-serif" fontSize="10">
            English
          </text>
          <text x="220" y="128" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="700">
            A-
          </text>
          <text x="72" y="148" fill="#0c1222" fillOpacity="0.5" fontFamily="system-ui,sans-serif" fontSize="10">
            Science
          </text>
          <text x="220" y="148" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="700">
            B+
          </text>
          <rect x="168" y="184" width="80" height="16" rx="8" fill="#e8f3f1" />
          <text x="182" y="195" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="10" fontWeight="700">
            GPA 3.8
          </text>
        </svg>
      );
    case "finance":
      return (
        <svg {...props}>
          <rect width="320" height="240" rx="16" fill="#f7f5f0" />
          <rect x="24" y="32" width="272" height="176" rx="14" fill="#fff" stroke="#0c1222" strokeOpacity="0.08" />
          <rect x="40" y="48" width="100" height="12" rx="6" fill="#0e7268" fillOpacity="0.2" />
          <rect x="40" y="68" width="140" height="8" rx="4" fill="#0c1222" fillOpacity="0.1" />
          <rect x="200" y="48" width="80" height="28" rx="8" fill="#e8f3f1" />
          <text x="214" y="66" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700">
            Paid
          </text>
          <rect x="40" y="96" width="240" height="56" rx="10" fill="#f3efe6" />
          <text x="56" y="118" fill="#0c1222" fillOpacity="0.5" fontFamily="system-ui,sans-serif" fontSize="10">
            Semester tuition
          </text>
          <text x="56" y="140" fill="#0c1222" fontFamily="system-ui,sans-serif" fontSize="18" fontWeight="700">
            12,450 ETB
          </text>
          <rect x="40" y="168" width="112" height="28" rx="8" fill="#0e7268" />
          <text x="58" y="186" fill="#fff" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600">
            Receipt #2841
          </text>
          <rect x="168" y="168" width="112" height="28" rx="8" fill="#fff" stroke="#0e7268" strokeOpacity="0.3" />
          <text x="186" y="186" fill="#0e7268" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="600">
            Send reminder
          </text>
        </svg>
      );
    default:
      return null;
  }
}
