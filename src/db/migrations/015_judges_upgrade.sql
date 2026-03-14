-- 015_judges_upgrade.sql — Extend judge schema for normalization, approval, and search features

-- Add name_variants to judges: stores alternate spellings scrapers may encounter
-- (e.g. "J. Smith", "Jane Smith", "J Smith" all resolve to the same record)
ALTER TABLE judges
  ADD COLUMN IF NOT EXISTS name_variants TEXT[] DEFAULT '{}';

-- Add is_approved to judge_course_maps: all user uploads require admin approval before display
ALTER TABLE judge_course_maps
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- Add source_label to judge_course_maps: human-readable source context (e.g. "AKC Nationals 2024")
ALTER TABLE judge_course_maps
  ADD COLUMN IF NOT EXISTS source_label TEXT;

-- Index for searching name_variants via GIN (supports @> and text search operators)
CREATE INDEX IF NOT EXISTS idx_judges_name_variants ON judges USING gin(name_variants);

-- Update the public read policy for course maps to only expose approved maps to anonymous users.
-- Admin/service role can see all rows regardless of RLS.
DROP POLICY IF EXISTS "Anyone can view course maps" ON judge_course_maps;

CREATE POLICY "Anyone can view approved course maps"
  ON judge_course_maps FOR SELECT
  USING (is_approved = true);

-- Admins can view all course maps (approved or pending) for moderation
CREATE POLICY "Admins can view all course maps"
  ON judge_course_maps FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- FUTURE HOOK: A route PATCH /api/admin/course-maps/:id/approve will set is_approved = true
-- A future admin UI will list pending uploads (WHERE is_approved = false) for review.
-- Do not build the admin UI yet — this comment marks the integration point.
