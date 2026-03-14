// Types for the K9 Body Workers feature.
// Body workers are canine massage therapists, chiropractors, rehabilitation
// specialists, and other hands-on practitioners who attend agility trials.

export type BodyWorkerSource = "self_registered" | "scraped" | "admin_added";

export type Modality =
  | "Massage"
  | "Chiropractic"
  | "Acupuncture"
  | "Hydrotherapy"
  | "Physical Therapy"
  | "Myofascial Release"
  | "Cold Laser"
  | "Rehabilitation"
  | "Other";

export const ALL_MODALITIES: Modality[] = [
  "Massage",
  "Chiropractic",
  "Acupuncture",
  "Hydrotherapy",
  "Physical Therapy",
  "Myofascial Release",
  "Cold Laser",
  "Rehabilitation",
  "Other",
];

export interface BodyWorker {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  business_name: string | null;
  modalities: string[];
  certifications: string[] | null;
  bio: string | null;
  service_area: string | null;
  travels_to_trials: boolean;
  booking_url: string | null;
  website_url: string | null;
  email: string | null;
  phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  photo_url: string | null;
  is_verified: boolean;
  is_claimed: boolean;
  source: BodyWorkerSource;
  created_at: string;
  updated_at: string;
}

/** Lightweight card used in search results and directory listings. */
export interface BodyWorkerSearchResult {
  id: string;
  name: string;
  slug: string;
  business_name: string | null;
  modalities: string[];
  photo_url: string | null;
  booking_url: string | null;
  is_verified: boolean;
  travels_to_trials: boolean;
  service_area: string | null;
  upcoming_trial_count: number;
}

/** A trial appearance record joined with body worker + trial info. */
export interface BodyWorkerTrialAppearance {
  id: string;
  body_worker_id: string;
  trial_id: string;
  confirmed: boolean;
  notes: string | null;
  booking_url_override: string | null;
  created_at: string;
}

/**
 * An appearance record enriched with trial details —
 * used on the body worker profile page.
 */
export interface AppearanceWithTrial extends BodyWorkerTrialAppearance {
  trial: {
    id: string;
    title: string;
    organization_id: string;
    start_date: string;
    end_date: string;
    venue_name: string;
    city: string;
    state: string;
  };
  /** Resolved booking URL: override if present, else body worker's main booking_url. */
  effective_booking_url: string | null;
}

/**
 * A body worker record enriched with appearance details —
 * used on the trial detail page.
 */
export interface BodyWorkerAtTrial {
  id: string;
  name: string;
  slug: string;
  business_name: string | null;
  modalities: string[];
  photo_url: string | null;
  is_verified: boolean;
  confirmed: boolean;
  notes: string | null;
  /** Resolved booking URL: override if present, else body worker's main booking_url. */
  effective_booking_url: string | null;
}

/** Payload for POST /api/body-workers/register */
export interface BodyWorkerRegistrationPayload {
  name: string;
  business_name?: string;
  bio?: string;
  modalities: string[];
  certifications?: string[];
  service_area?: string;
  travels_to_trials?: boolean;
  booking_url?: string;
  website_url?: string;
  email?: string;
  phone?: string;
  instagram_url?: string;
  facebook_url?: string;
  // photo is uploaded separately as multipart/form-data
}

/** Payload for POST /api/body-workers/[slug]/trial-appearances */
export interface AddTrialAppearancePayload {
  trial_id: string;
  notes?: string;
  booking_url_override?: string;
}
