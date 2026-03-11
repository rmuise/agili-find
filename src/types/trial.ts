export type OrganizationId = "akc" | "usdaa" | "cpe" | "nadac" | "uki" | "ckc";

export interface Organization {
  id: OrganizationId;
  name: string;
  website_url: string;
  scraper_status: "active" | "disabled";
}

export interface Venue {
  id: string;
  name: string;
  address_raw: string;
  address_line: string | null;
  city: string;
  state: string;
  postal_code: string | null;
  country: string;
  lat: number;
  lng: number;
  geocode_status: "success" | "failed" | "manual";
}

export interface Trial {
  id: string;
  organization_id: OrganizationId;
  venue_id: string;
  external_id: string;
  title: string;
  hosting_club: string | null;
  start_date: string;
  end_date: string;
  entry_open_date: string | null;
  entry_close_date: string | null;
  classes: string[];
  judges: string[];
  secretary_name: string | null;
  source_url: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TrialWithVenue extends Trial {
  venue: Venue;
  organization: Organization;
  distance_km?: number;
}
