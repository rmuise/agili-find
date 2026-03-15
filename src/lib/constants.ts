/**
 * AGILIFIND SHARED CONSTANTS
 * Single source of truth for all shared configuration.
 * Import from here. Never redefine these values elsewhere.
 */

// ── Organization metadata ────────────────────────────────────
// Canonical list of all supported agility organizations.
// `color` is a Tailwind bg class for non-CSS contexts (map markers, etc.)

export const ORGANIZATIONS = [
  { id: "akc", name: "AKC", fullName: "American Kennel Club", color: "bg-blue-500" },
  { id: "usdaa", name: "USDAA", fullName: "United States Dog Agility Association", color: "bg-red-500" },
  { id: "cpe", name: "CPE", fullName: "Canine Performance Events", color: "bg-green-500" },
  { id: "nadac", name: "NADAC", fullName: "North American Dog Agility Council", color: "bg-purple-500" },
  { id: "uki", name: "UKI", fullName: "UK Agility International", color: "bg-orange-500" },
  { id: "ckc", name: "CKC", fullName: "Canadian Kennel Club", color: "bg-pink-500" },
  { id: "aac", name: "AAC", fullName: "Agility Association of Canada", color: "bg-teal-500" },
  { id: "tdaa", name: "TDAA", fullName: "Teacup Dogs Agility Association", color: "bg-amber-500" },
  { id: "isc", name: "ISC", fullName: "International Selection Committee", color: "bg-yellow-600" },
] as const;

/** All valid org IDs as an array */
export const ORG_CODES = ORGANIZATIONS.map((o) => o.id);

/** Tailwind bg-* class by org ID */
export const ORG_COLORS: Record<string, string> = Object.fromEntries(
  ORGANIZATIONS.map((o) => [o.id, o.color])
);

/** Display names by org ID */
export const ORG_NAMES: Record<string, string> = Object.fromEntries(
  ORGANIZATIONS.map((o) => [o.id, o.name])
);

/**
 * Hex color values by org ID.
 * Used in canvas/PDF rendering, map markers, and anywhere CSS vars aren't available.
 * These MUST match the --akc, --usdaa, etc. CSS variables in globals.css.
 */
export const ORG_HEX_COLORS: Record<string, string> = {
  akc: "#85b7eb",
  usdaa: "#e8ff47",
  cpe: "#5dcaa5",
  nadac: "#fac775",
  uki: "#ed93b1",
  ckc: "#afa9ec",
  aac: "#14b8a6",
  tdaa: "#d97706",
  isc: "#e8a838",
};

// ── Trial status ─────────────────────────────────────────────
// Computed from dates, never stored in the database.

export type TrialStatus = "open" | "low" | "soon" | "registering" | "closed" | "waitlist";

export const TRIAL_STATUS_LABELS: Record<TrialStatus, string> = {
  open: "Open",
  low: "Spots filling",
  soon: "Opening soon",
  registering: "Registering",
  closed: "Closed",
  waitlist: "Waitlist",
};

/** Days before entry_close_date at which status flips to "closing soon" */
export const CLOSING_SOON_THRESHOLD_DAYS = 7;

// ── Saved trial status labels (schedule page) ────────────────

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  interested: {
    label: "Interested",
    color: "text-[#85b7eb]",
    bg: "bg-[rgba(55,138,221,0.14)] border-[rgba(55,138,221,0.22)]",
  },
  registered: {
    label: "Registered",
    color: "text-[#5dcaa5]",
    bg: "bg-[rgba(93,202,165,0.12)] border-[rgba(93,202,165,0.2)]",
  },
  attending: {
    label: "Attending",
    color: "text-[#afa9ec]",
    bg: "bg-[rgba(127,119,221,0.14)] border-[rgba(127,119,221,0.22)]",
  },
};

// ── Provider types ───────────────────────────────────────────

export const PROVIDER_TYPES = [
  { value: "club", label: "Club / Trial Host" },
  { value: "presenter", label: "Seminar Presenter" },
  { value: "facility", label: "Training Facility" },
  { value: "body_worker", label: "Canine Body Worker" },
  { value: "vendor", label: "Equipment Vendor" },
  { value: "photographer", label: "Photographer / Videographer" },
] as const;

export const VALID_PROVIDER_TYPES = PROVIDER_TYPES.map((t) => t.value);

// ── Levels ───────────────────────────────────────────────────

export const ALL_LEVELS = [
  "Beginner", "Starters", "Novice", "Open", "Advanced", "Masters",
  "P1", "P2", "P3",
];

// ── Sort options ─────────────────────────────────────────────

export type SortOption = "date-asc" | "distance-asc" | "recently-added" | "registration-closing";

export const SORT_LABELS: Record<SortOption, string> = {
  "date-asc": "Date: soonest",
  "distance-asc": "Distance: nearest",
  "recently-added": "Recently added",
  "registration-closing": "Registration closing",
};

// ── localStorage keys ────────────────────────────────────────
// All in one place so they never conflict.

export const STORAGE_KEYS = {
  THEME: "agili-theme",
  DISTANCE_UNIT: "agili-distance-unit",
} as const;

// ── API defaults ─────────────────────────────────────────────

export const API_DEFAULTS = {
  PAGE: 1,
  LIMIT: 25,
  MAX_LIMIT: 100,
  SORT: "date" as const,
  MAX_RADIUS_MI: 500,
};
