import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Star,
  Calendar,
  Bell,
  Search,
  UserCircle,
  BookOpen,
  Building,
} from "lucide-react";

// ── Top-level navbar (public) ────────────────────────────────
export interface NavLink {
  href: string;
  label: string;
}

export const TOP_NAV_LINKS: NavLink[] = [
  { href: "/trials", label: "Browse Trials" },
  { href: "/map", label: "Map View" },
  { href: "/saved", label: "Saved" },
];

// ── Authenticated quick-links (next to logo) ────────────────
export interface QuickLink {
  href: string;
  label: string;
  icon: LucideIcon;
  authRequired: boolean;
}

export const QUICK_LINKS: QuickLink[] = [
  { href: "/schedule", label: "My Schedule", icon: Calendar, authRequired: true },
  { href: "/seminars/my", label: "My Seminars", icon: BookOpen, authRequired: true },
  { href: "/training-spaces", label: "Training", icon: Building, authRequired: false },
];

// ── Dashboard sidebar ────────────────────────────────────────
export interface SidebarLink {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  countVariant?: "danger";
}

export interface SidebarSection {
  section: string;
  links: SidebarLink[];
}

export const SIDEBAR_NAV: SidebarSection[] = [
  {
    section: "My Account",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/saved", label: "Saved Trials", icon: Star, count: 5 },
      { href: "/dashboard/calendar", label: "My Calendar", icon: Calendar, count: 3 },
    ],
  },
  {
    section: "Alerts",
    links: [
      { href: "/alerts", label: "Notifications", icon: Bell, count: 3, countVariant: "danger" },
      { href: "/alerts/searches", label: "Saved Searches", icon: Search },
    ],
  },
  {
    section: "Account",
    links: [
      { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
    ],
  },
];
