-- Training spaces — user-submitted agility training facilities
CREATE TABLE IF NOT EXISTS training_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  surface_type TEXT CHECK (surface_type IN ('grass', 'dirt', 'rubber', 'turf', 'sand', 'concrete', 'other')),
  indoor BOOLEAN NOT NULL DEFAULT false,
  has_equipment BOOLEAN NOT NULL DEFAULT false,
  equipment_details TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  rental_info TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_spaces_location ON training_spaces USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_training_spaces_status ON training_spaces (status);
CREATE INDEX IF NOT EXISTS idx_training_spaces_user ON training_spaces (user_id);
CREATE INDEX IF NOT EXISTS idx_training_spaces_indoor ON training_spaces (indoor);

-- Enable RLS
ALTER TABLE training_spaces ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved training spaces
CREATE POLICY "Anyone can read approved training spaces"
  ON training_spaces FOR SELECT
  USING (status = 'approved');

-- Users can read their own (any status)
CREATE POLICY "Users can read own training spaces"
  ON training_spaces FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own
CREATE POLICY "Users can insert own training spaces"
  ON training_spaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own
CREATE POLICY "Users can update own training spaces"
  ON training_spaces FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own
CREATE POLICY "Users can delete own training spaces"
  ON training_spaces FOR DELETE
  USING (auth.uid() = user_id);
