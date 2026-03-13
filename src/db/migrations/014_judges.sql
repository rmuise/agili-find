-- 014_judges.sql — Judge profiles and course map gallery

-- Judges table
CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  bio TEXT,
  location TEXT,
  organizations TEXT[] DEFAULT '{}',
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judges_name ON judges(name);

-- Course maps uploaded for judges
CREATE TABLE IF NOT EXISTS judge_course_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  trial_id UUID REFERENCES trials(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  class_name TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judge_course_maps_judge ON judge_course_maps(judge_id);

-- RLS
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view judges"
  ON judges FOR SELECT USING (true);

CREATE POLICY "Admins can manage judges"
  ON judges FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE judge_course_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course maps"
  ON judge_course_maps FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload course maps"
  ON judge_course_maps FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

-- Backfill judges from existing trial data
INSERT INTO judges (name, slug)
SELECT DISTINCT
  j.name,
  lower(regexp_replace(regexp_replace(trim(j.name), '[^a-zA-Z0-9]+', '-', 'g'), '^-|-$', '', 'g'))
FROM trials, unnest(trials.judges) AS j(name)
WHERE j.name IS NOT NULL AND trim(j.name) != '' AND trim(j.name) != 'TBA'
ON CONFLICT (slug) DO NOTHING;
