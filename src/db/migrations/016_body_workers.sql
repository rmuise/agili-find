-- Migration 016: K9 Body Workers
-- Creates the body_workers and body_worker_trial_appearances tables.
-- Body workers are canine massage therapists, chiropractors, rehabilitation
-- specialists, and other hands-on practitioners who attend agility trials.

-- ============================================================
-- TABLE: body_workers
-- ============================================================

CREATE TABLE IF NOT EXISTS body_workers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Auth link — null until the practitioner claims their own profile
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Core identity
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,          -- URL-safe, e.g. "jane-smith"
  business_name     TEXT,                          -- e.g. "Paws in Motion Canine Massage"

  -- Service details
  modalities        TEXT[] NOT NULL DEFAULT '{}',  -- ["Massage", "Chiropractic", …]
  certifications    TEXT[],                         -- ["CCMT", "CVT", "CCRP", …]
  bio               TEXT,
  service_area      TEXT,                          -- "Pacific Northwest", "travels nationally"
  travels_to_trials BOOLEAN NOT NULL DEFAULT FALSE,

  -- Contact / booking (booking_url is the primary conversion point)
  booking_url       TEXT,                          -- Calendly, Jane App, Square, Acuity, etc.
  website_url       TEXT,
  email             TEXT,                          -- public contact (optional)
  phone             TEXT,                          -- public contact (optional)
  instagram_url     TEXT,
  facebook_url      TEXT,

  -- Media
  photo_url         TEXT,

  -- Admin / trust flags
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE, -- admin-verified practitioner
  is_claimed        BOOLEAN NOT NULL DEFAULT FALSE, -- practitioner has claimed their profile

  -- Provenance
  source            TEXT NOT NULL DEFAULT 'admin_added'
                    CHECK (source IN ('self_registered', 'scraped', 'admin_added')),

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: body_worker_trial_appearances
-- ============================================================

CREATE TABLE IF NOT EXISTS body_worker_trial_appearances (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  body_worker_id        UUID NOT NULL REFERENCES body_workers(id) ON DELETE CASCADE,
  trial_id              UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,

  -- Whether the practitioner self-confirmed (vs scraped/assumed)
  confirmed             BOOLEAN NOT NULL DEFAULT FALSE,

  -- Practitioner notes shown to competitors
  notes                 TEXT,                    -- "Available Friday only", "By appointment"

  -- Override booking URL for this specific trial
  booking_url_override  TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (body_worker_id, trial_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_body_workers_name
  ON body_workers (name);

CREATE INDEX IF NOT EXISTS idx_body_workers_slug
  ON body_workers (slug);

CREATE INDEX IF NOT EXISTS idx_body_workers_user_id
  ON body_workers (user_id)
  WHERE user_id IS NOT NULL;

-- Full-text search index on name + business_name
CREATE INDEX IF NOT EXISTS idx_body_workers_fts
  ON body_workers USING gin (
    to_tsvector('english', name || ' ' || COALESCE(business_name, ''))
  );

CREATE INDEX IF NOT EXISTS idx_bwta_trial_id
  ON body_worker_trial_appearances (trial_id);

CREATE INDEX IF NOT EXISTS idx_bwta_body_worker_id
  ON body_worker_trial_appearances (body_worker_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_body_workers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_body_workers_updated_at
  BEFORE UPDATE ON body_workers
  FOR EACH ROW EXECUTE FUNCTION update_body_workers_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE body_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_worker_trial_appearances ENABLE ROW LEVEL SECURITY;

-- Public read access for all body worker profiles
CREATE POLICY "Anyone can view body workers"
  ON body_workers FOR SELECT
  USING (TRUE);

-- Public read access for trial appearances
CREATE POLICY "Anyone can view body worker trial appearances"
  ON body_worker_trial_appearances FOR SELECT
  USING (TRUE);

-- ============================================================
-- SUPABASE STORAGE BUCKET (run via Supabase dashboard or API)
-- ============================================================
-- Create a PUBLIC bucket named "body-worker-photos".
-- This follows the same pattern as the judge-assets bucket.
-- Images are served with public URLs; no signed URL generation needed.
--
-- Dashboard: Storage > New Bucket > Name: body-worker-photos > Public: ON
-- Or via management API:
--   INSERT INTO storage.buckets (id, name, public)
--   VALUES ('body-worker-photos', 'body-worker-photos', true);
