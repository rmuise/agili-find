import type { OrganizationId } from "./trial";

export interface ScrapedTrial {
  external_id: string;
  organization_id: OrganizationId;
  title: string;
  hosting_club: string | null;
  start_date: string; // ISO date
  end_date: string; // ISO date
  entry_close_date: string | null;
  classes: string[];
  judges: string[];
  secretary_name: string | null;
  source_url: string;
  venue: {
    name: string;
    address_raw: string;
    city: string;
    state: string;
    country: string;
  };
  raw_data: Record<string, unknown>;
}

export interface ScrapeJob {
  id: string;
  organization_id: OrganizationId;
  status: "pending" | "processing" | "complete" | "failed";
  cursor: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

export interface ScrapeResult {
  organization_id: OrganizationId;
  trials_found: number;
  trials_added: number;
  trials_updated: number;
  errors: Array<{ message: string; trial_id?: string }>;
  duration_ms: number;
}
