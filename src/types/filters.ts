/**
 * Filter, search, and UI types.
 * Moved from the legacy src/lib/types.ts during the foundation reset.
 * These types are used by the filter sidebar/drawer, trials page, and alerts page.
 */

import type { TrialStatus, SortOption } from "@/lib/constants";

// Re-export for convenience so consumers can import from one place
export type { TrialStatus, SortOption };

// ── Search & Filter ─────────────────────────────────────────

export interface SearchFilters {
  location: string;
  orgs: string[];
  dateFrom?: string;
  dateTo?: string;
  distanceKm: number;
  levels: string[];
  statuses: TrialStatus[];
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: SearchFilters = {
  location: "",
  orgs: ["akc", "usdaa", "cpe", "nadac", "uki", "ckc"],
  dateFrom: undefined,
  dateTo: undefined,
  distanceKm: 150,
  levels: ["Beginner", "Starters", "Novice", "Open", "Advanced", "Masters"],
  statuses: ["open", "low", "soon", "registering"],
  sortBy: "date-asc",
};

// ── Notification ────────────────────────────────────────────

export type NotifType = "closing" | "new-trial" | "reg-open" | "spots-low" | "reminder";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  trialId?: string;
  trialName?: string;
  read: boolean;
  createdAt: string;
}

// ── Alert Preferences ───────────────────────────────────────

export interface AlertPreferences {
  closingSoon: boolean;
  newTrials: boolean;
  regOpen: boolean;
  spotsFilling: boolean;
  weeklyDigest: boolean;
  frequency: "immediate" | "daily" | "weekly";
}

export const DEFAULT_ALERT_PREFS: AlertPreferences = {
  closingSoon: true,
  newTrials: true,
  regOpen: true,
  spotsFilling: false,
  weeklyDigest: false,
  frequency: "daily",
};

// ── Saved Search ────────────────────────────────────────────

export interface SavedSearch {
  id: string;
  label: string;
  location: string;
  distanceKm: number;
  orgs: string[];
  levels: string[];
  alertsEnabled: boolean;
  newMatchCount?: number;
  createdAt: string;
}

// ── User ────────────────────────────────────────────────────

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarInitials: string;
  savedTrialIds: string[];
  savedSearches: SavedSearch[];
  alertPrefs: AlertPreferences;
  homeLocation?: string;
  homeDistanceKm?: number;
}
