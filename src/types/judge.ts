export interface Judge {
  id: string;
  name: string;
  slug: string;
  photo_url: string | null;
  bio: string | null;
  location: string | null;
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
  uploaded_by: string | null;
  created_at: string;
  trial?: {
    id: string;
    title: string;
    organization_id: string;
    start_date: string;
  };
}
