import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

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

/** Format a distance value for display in the user's preferred unit.
 *  @param miles  The raw distance in miles (as returned by the API)
 *  @param unit   'mi' or 'km'
 */
export function formatDistance(miles: number, unit: 'mi' | 'km'): string {
  if (unit === 'km') {
    return `${Math.round(miles * 1.60934)} km`;
  }
  return `${Math.round(miles)} mi`;
}

/** Format a distance value for display when the source is in kilometres.
 *  @param km   The raw distance in km
 *  @param unit 'mi' or 'km'
 */
export function formatDistanceFromKm(km: number, unit: 'mi' | 'km'): string {
  if (unit === 'mi') {
    return `${Math.round(km * 0.621371)} mi`;
  }
  return `${Math.round(km)} km`;
}

/** Format a trial date range for display. Pass ISO date strings. */
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
