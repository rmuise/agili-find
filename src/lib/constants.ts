/** Organization metadata */
export const ORGANIZATIONS = [
  { id: "akc", name: "AKC", color: "bg-blue-500" },
  { id: "usdaa", name: "USDAA", color: "bg-red-500" },
  { id: "cpe", name: "CPE", color: "bg-green-500" },
  { id: "nadac", name: "NADAC", color: "bg-purple-500" },
  { id: "uki", name: "UKI", color: "bg-orange-500" },
  { id: "ckc", name: "CKC", color: "bg-pink-500" },
  { id: "aac", name: "AAC", color: "bg-teal-500" },
  { id: "tdaa", name: "TDAA", color: "bg-amber-500" },
] as const;

/** Tailwind background color classes by organization ID */
export const ORG_COLORS: Record<string, string> = Object.fromEntries(
  ORGANIZATIONS.map((o) => [o.id, o.color])
);

/** Display names by organization ID */
export const ORG_NAMES: Record<string, string> = Object.fromEntries(
  ORGANIZATIONS.map((o) => [o.id, o.name])
);

/** Hex color values by organization ID (for canvas/map rendering) */
export const ORG_HEX_COLORS: Record<string, string> = {
  akc: "#85b7eb",
  usdaa: "#e8ff47",
  cpe: "#5dcaa5",
  nadac: "#fac775",
  uki: "#ed93b1",
  ckc: "#afa9ec",
  aac: "#14b8a6",
  tdaa: "#d97706",
};

export const STATUS_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
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

export const PROVIDER_TYPES = [
  { value: "club", label: "Club / Trial Host" },
  { value: "presenter", label: "Seminar Presenter" },
  { value: "facility", label: "Training Facility" },
  { value: "body_worker", label: "Canine Body Worker" },
  { value: "vendor", label: "Equipment Vendor" },
  { value: "photographer", label: "Photographer / Videographer" },
] as const;

export const VALID_PROVIDER_TYPES = PROVIDER_TYPES.map((t) => t.value);
