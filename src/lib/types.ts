// ── Organizations ──────────────────────────────────────────
export type OrgId = 'AKC' | 'USDAA' | 'CPE' | 'NADAC' | 'UKI' | 'CKC';

export const ORG_LABELS: Record<OrgId, string> = {
  AKC: 'AKC',
  USDAA: 'USDAA',
  CPE: 'CPE',
  NADAC: 'NADAC',
  UKI: 'UKI',
  CKC: 'CKC',
};

export const ORG_COLORS: Record<OrgId, string> = {
  AKC: '#85b7eb',
  USDAA: '#e8ff47',
  CPE: '#5dcaa5',
  UKI: '#ed93b1',
  NADAC: '#fac775',
  CKC: '#afa9ec',
};

// ── Registration Status ─────────────────────────────────────
export type TrialStatus = 'open' | 'low' | 'soon' | 'registering' | 'closed' | 'waitlist';

export const STATUS_LABELS: Record<TrialStatus, string> = {
  open: 'Open',
  low: 'Spots filling',
  soon: 'Opening soon',
  registering: 'Registering',
  closed: 'Closed',
  waitlist: 'Waitlist',
};

// ── Trial ───────────────────────────────────────────────────
export interface Trial {
  id: string;
  name: string;
  org: OrgId;
  startDate: string;       // ISO date string
  endDate: string;         // ISO date string
  city: string;
  province: string;        // or state
  venueName: string;
  venueAddress?: string;
  distanceKm?: number;
  status: TrialStatus;
  spotsTotal?: number;
  spotsFilled?: number;
  spotsRemaining?: number;
  registrationCloses?: string; // ISO date string
  levels: string[];
  classes: TrialClass[];
  rings?: number;
  entryFee?: number;
  entrySoftware?: string;
  entryUrl?: string;
  premiumUrl?: string;
  judges?: Judge[];
  hostClub?: string;
  notes?: string;
  surface?: string;
  parking?: string;
  crating?: string;
  featured?: boolean;
}

export interface TrialClass {
  name: string;
  levels: string[];
  ring?: number;
  days?: ('sat' | 'sun' | 'both')[];
  spotsRemaining?: number;
}

export interface Judge {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  classes: string[];
  ring?: number;
  days?: string;
}

// ── Search & Filter ─────────────────────────────────────────
export interface SearchFilters {
  location: string;
  orgs: OrgId[];
  dateFrom?: string;
  dateTo?: string;
  distanceKm: number;
  levels: string[];
  statuses: TrialStatus[];
  sortBy: SortOption;
}

export type SortOption =
  | 'date-asc'
  | 'distance-asc'
  | 'recently-added'
  | 'registration-closing';

export const SORT_LABELS: Record<SortOption, string> = {
  'date-asc': 'Date: soonest',
  'distance-asc': 'Distance: nearest',
  'recently-added': 'Recently added',
  'registration-closing': 'Registration closing',
};

export const DEFAULT_FILTERS: SearchFilters = {
  location: '',
  orgs: ['AKC', 'USDAA', 'CPE', 'NADAC', 'UKI', 'CKC'],
  dateFrom: undefined,
  dateTo: undefined,
  distanceKm: 150,
  levels: ['Beginner', 'Starters', 'Novice', 'Open', 'Advanced', 'Masters'],
  statuses: ['open', 'low', 'soon', 'registering'],
  sortBy: 'date-asc',
};

export const ALL_LEVELS = [
  'Beginner', 'Starters', 'Novice', 'Open', 'Advanced', 'Masters',
  'P1', 'P2', 'P3',
];

// ── Saved Search ────────────────────────────────────────────
export interface SavedSearch {
  id: string;
  label: string;
  location: string;
  distanceKm: number;
  orgs: OrgId[];
  levels: string[];
  alertsEnabled: boolean;
  newMatchCount?: number;
  createdAt: string;
}

// ── Notification ────────────────────────────────────────────
export type NotifType = 'closing' | 'new-trial' | 'reg-open' | 'spots-low' | 'reminder';

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
  frequency: 'immediate' | 'daily' | 'weekly';
}

export const DEFAULT_ALERT_PREFS: AlertPreferences = {
  closingSoon: true, newTrials: true, regOpen: true,
  spotsFilling: false, weeklyDigest: false, frequency: 'daily',
};

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
