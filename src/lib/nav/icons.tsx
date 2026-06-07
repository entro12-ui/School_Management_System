import {
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  MessageSquare,
  Network,
  Settings,
  Shield,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const NAV_ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  ClipboardList,
  ClipboardCheck,
  GraduationCap,
  IdCard,
  Users,
  UserCheck,
  Wallet,
  BookOpen,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Network,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Download,
  Settings,
  Shield,
};

export type NavItemConfig = {
  href: string;
  label: string;
  icon: keyof typeof NAV_ICONS;
};
