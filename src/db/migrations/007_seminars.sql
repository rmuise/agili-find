-- Seminars table — user-submitted agility seminars/clinics
CREATE TABLE IF NOT EXISTS seminars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  venue_name TEXT NOT NULL,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  contact_email TEXT,
  contact_url TEXT,
  price TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for geo queries
CREATE INDEX IF NOT EXISTS idx_seminars_location ON seminars USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_seminars_dates ON seminars (start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_seminars_status ON seminars (status);
CREATE INDEX IF NOT EXISTS idx_seminars_user ON seminars (user_id);

-- Enable RLS
ALTER TABLE seminars ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved seminars
CREATE POLICY "Anyone can read approved seminars"
  ON seminars FOR SELECT
  USING (status = 'approved');

-- Users can read their own seminars (any status)
CREATE POLICY "Users can read own seminars"
  ON seminars FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own seminars
CREATE POLICY "Users can insert own seminars"
  ON seminars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending seminars
CREATE POLICY "Users can update own seminars"
  ON seminars FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own seminars
CREATE POLICY "Users can delete own seminars"
  ON seminars FOR DELETE
  USING (auth.uid() = user_id);
