-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  scraper_status TEXT NOT NULL DEFAULT 'active' CHECK (scraper_status IN ('active', 'disabled'))
);

-- Seed organizations
INSERT INTO organizations (id, name, website_url) VALUES
  ('akc', 'American Kennel Club', 'https://www.akc.org'),
  ('usdaa', 'United States Dog Agility Association', 'https://www.usdaa.com'),
  ('cpe', 'Canine Performance Events', 'https://www.k9cpe.com'),
  ('nadac', 'North American Dog Agility Council', 'https://www.nadac.com'),
  ('uki', 'UK Agility International', 'https://ukagilityinternational.com'),
  ('ckc', 'Canadian Kennel Club', 'https://www.ckc.ca')
ON CONFLICT (id) DO NOTHING;

-- Venues table with PostGIS geography column
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address_raw TEXT NOT NULL,
  address_line TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  location GEOGRAPHY(Point, 4326),
  geocode_status TEXT NOT NULL DEFAULT 'pending' CHECK (geocode_status IN ('success', 'failed', 'manual', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create spatial index on venues
CREATE INDEX IF NOT EXISTS idx_venues_location ON venues USING GIST (location);

-- Unique constraint on raw address to avoid duplicate venues
CREATE UNIQUE INDEX IF NOT EXISTS idx_venues_address_raw ON venues (address_raw);

-- Trials table
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  venue_id UUID REFERENCES venues(id),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  hosting_club TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  entry_open_date DATE,
  entry_close_date DATE,
  classes TEXT[] DEFAULT '{}',
  judges TEXT[] DEFAULT '{}',
  secretary_name TEXT,
  source_url TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, external_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_trials_org_date ON trials (organization_id, start_date);
CREATE INDEX IF NOT EXISTS idx_trials_start_date ON trials (start_date);
CREATE INDEX IF NOT EXISTS idx_trials_classes ON trials USING GIN (classes);
CREATE INDEX IF NOT EXISTS idx_trials_judges ON trials USING GIN (judges);

-- Scrape queue table
CREATE TABLE IF NOT EXISTS scrape_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
  cursor JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrape_queue_status ON scrape_queue (status, created_at);

-- Scrape log table
CREATE TABLE IF NOT EXISTS scrape_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trials_found INTEGER NOT NULL DEFAULT 0,
  trials_added INTEGER NOT NULL DEFAULT 0,
  trials_updated INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
