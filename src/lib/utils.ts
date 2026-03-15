import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { CLOSING_SOON_THRESHOLD_DAYS } from "@/lib/constants";
import type { TrialStatus } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a URL-friendly slug from a name. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Distance formatting ──────────────────────────────────────

/** Format a distance value for display (source in miles). */
export function formatDistance(miles: number, unit: "mi" | "km"): string {
  if (unit === "km") {
    return `${Math.round(miles * 1.60934)} km`;
  }
  return `${Math.round(miles)} mi`;
}

/** Format a distance value for display (source in kilometres). */
export function formatDistanceFromKm(km: number, unit: "mi" | "km"): string {
  if (unit === "mi") {
    return `${Math.round(km * 0.621371)} mi`;
  }
  return `${Math.round(km)} km`;
}

// ── Date formatting ──────────────────────────────────────────

/**
 * Format a trial date range for display. Pass ISO date strings.
 * Output includes day-of-week: "Fri, Jan 1 – Sun, Jan 5, 2025"
 */
export function formatTrialDateRange(startDate: string, endDate: string): string {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (startDate === endDate) {
    return format(start, "EEE, MMM d, yyyy");
  }
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, "EEE, MMM d")} – ${format(end, "d, yyyy")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
}

/**
 * Format a date range (compact, no day-of-week).
 * Output: "Jan 1–5, 2025" or "Jan 1 – Feb 5, 2025"
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  if (startDate === endDate) {
    return start.toLocaleDateString("en-CA", { ...opts, year: "numeric" });
  }

  if (start.getMonth() === end.getMonth()) {
    return `${start.toLocaleDateString("en-CA", opts)}–${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString("en-CA", opts)} – ${end.toLocaleDateString("en-CA", opts)}, ${start.getFullYear()}`;
}

// ── Trial status ─────────────────────────────────────────────

/**
 * Compute a trial's registration status from its entry_close_date.
 * This is the single place trial status is derived — never store it.
 */
export function getTrialStatus(entryCloseDate: string | null | undefined): TrialStatus {
  if (!entryCloseDate) return "open";
  const now = new Date();
  const closeDate = new Date(entryCloseDate);
  const daysUntilClose = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntilClose < 0) return "closed";
  if (daysUntilClose <= CLOSING_SOON_THRESHOLD_DAYS) return "soon";
  return "open";
}

/** Days until a target date (positive = future, negative = past). */
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** Fill percentage (clamped 0–100). */
export function fillPercent(filled?: number, total?: number): number {
  if (!filled || !total) return 0;
  return Math.min(Math.round((filled / total) * 100), 100);
}

/** Relative time string from an ISO timestamp. */
export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return mins <= 1 ? "Just now" : `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(isoString).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

/** Group notifications by date bucket. */
export function groupNotificationsByDate<T extends { createdAt: string }>(
  items: T[]
): { label: string; items: T[] }[] {
  const today: T[] = [];
  const yesterday: T[] = [];
  const earlier: T[] = [];
  const now = Date.now();

  items.forEach((n) => {
    const diff = now - new Date(n.createdAt).getTime();
    const hours = diff / 3600000;
    if (hours < 24) today.push(n);
    else if (hours < 48) yesterday.push(n);
    else earlier.push(n);
  });

  const groups: { label: string; items: T[] }[] = [];
  if (today.length) groups.push({ label: "Today", items: today });
  if (yesterday.length) groups.push({ label: "Yesterday", items: yesterday });
  if (earlier.length) groups.push({ label: "Earlier", items: earlier });
  return groups;
}
