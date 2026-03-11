import type { OrganizationId } from "./trial";

export interface SearchParams {
  lat?: number;
  lng?: number;
  radius?: number; // in miles
  orgs?: OrganizationId[];
  judge?: string;
  classes?: string[];
  startDate?: string;
  endDate?: string;
  sort?: "date" | "distance" | "organization";
  page?: number;
  limit?: number;
}

export interface SearchResult {
  trials: TrialResult[];
  total: number;
  page: number;
  limit: number;
}

export interface TrialResult {
  id: string;
  title: string;
  hosting_club: string | null;
  organization_id: OrganizationId;
  organization_name: string;
  start_date: string;
  end_date: string;
  entry_close_date: string | null;
  classes: string[];
  judges: string[];
  source_url: string;
  venue_name: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  distance_miles: number | null;
}
