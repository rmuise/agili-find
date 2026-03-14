export interface Judge {
  id: string;
  name: string;
  slug: string;
  /** Alternate spellings/abbreviations found during scraping (e.g. "J. Smith", "Jane Smith") */
  name_variants: string[];
  photo_url: string | null;
  bio: string | null;
  /** City/state if publicly available */
  location: string | null;
  /** Org certifications this judge holds (e.g. ["akc", "usdaa", "cpe"]) */
  organizations: string[];
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface JudgeCourseMap {
  id: string;
  judge_id: string;
  trial_id: string | null;
  image_url: string;
  caption: string | null;
  class_name: string | null;
  /** Human-readable source label, e.g. "AKC Regionals 2024" */
  source_label: string | null;
  /** False until an admin approves — uploaded maps are never shown publicly until approved */
  is_approved: boolean;
  uploaded_by: string | null;
  created_at: string;
  trial?: {
    id: string;
    title: string;
    organization_id: string;
    start_date: string;
  };
}

/** Shape returned by GET /api/judges/search?q= */
export interface JudgeSearchResult {
  id: string;
  name: string;
  slug: string;
  organizations: string[];
  location: string | null;
  photo_url: string | null;
  trial_count: number;
}
