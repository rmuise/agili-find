-- Service providers (clubs, presenters, vendors, body workers, etc.)
CREATE TABLE IF NOT EXISTS srv_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('club', 'presenter', 'facility', 'body_worker', 'vendor', 'photographer')),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  website_url TEXT,
  description TEXT,
  logo_url TEXT,
  location_city TEXT,
  location_province TEXT,
  service_radius_km INT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider ↔ Trial associations
CREATE TABLE IF NOT EXISTS srv_trial_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES srv_providers(id) ON DELETE CASCADE NOT NULL,
  trial_id TEXT NOT NULL,
  is_attending BOOLEAN DEFAULT FALSE,
  association_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, trial_id)
);

CREATE INDEX IF NOT EXISTS idx_srv_trial_assoc_trial ON srv_trial_associations(trial_id);
CREATE INDEX IF NOT EXISTS idx_srv_trial_assoc_provider ON srv_trial_associations(provider_id);

-- Nearby places cache (Google Places / stub data)
CREATE TABLE IF NOT EXISTS srv_places_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vet', 'emergency_vet', 'pet_store', 'body_worker')),
  place_id TEXT NOT NULL,
  name TEXT,
  address TEXT,
  phone TEXT,
  rating NUMERIC(2,1),
  maps_url TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trial_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_srv_places_cache_trial ON srv_places_cache(trial_id);

-- RLS on provider tables
ALTER TABLE srv_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE srv_trial_associations ENABLE ROW LEVEL SECURITY;

-- Public read access for service providers and associations
CREATE POLICY "Anyone can view providers" ON srv_providers FOR SELECT USING (true);
CREATE POLICY "Anyone can view trial associations" ON srv_trial_associations FOR SELECT USING (true);
