-- ===== 009: Notifications =====
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_entry_close BOOLEAN DEFAULT TRUE,
  email_new_trials BOOLEAN DEFAULT TRUE,
  email_seminars BOOLEAN DEFAULT FALSE,
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  search_radius_miles INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id, notification_type, reference_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own notification preferences"
    ON notification_preferences FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view own notification log"
    ON notification_log FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== 010: Social (follows, reviews, profile fields) =====
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dogs TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE TABLE IF NOT EXISTS trial_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trial_id UUID REFERENCES trials(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  results TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trial_id)
);

CREATE INDEX IF NOT EXISTS idx_trial_reviews_trial ON trial_reviews(trial_id);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view follows" ON follows FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can manage own follows" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can delete own follows" ON follows FOR DELETE USING (auth.uid() = follower_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Anyone can view trial reviews" ON trial_reviews FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Users can manage own reviews" ON trial_reviews FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== 012: Services (providers, associations, places cache) =====
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

ALTER TABLE srv_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE srv_trial_associations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view providers" ON srv_providers FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Anyone can view trial associations" ON srv_trial_associations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== 013: Provider auth (owner_id, write policies) =====
DO $$ BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'attendee', 'provider', 'admin'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE srv_providers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_srv_providers_owner ON srv_providers(owner_id);

DO $$ BEGIN
  CREATE POLICY "Providers can insert own profile"
    ON srv_providers FOR INSERT WITH CHECK (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Providers can update own profile"
    ON srv_providers FOR UPDATE USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Providers can insert own associations"
    ON srv_trial_associations FOR INSERT
    WITH CHECK (provider_id IN (SELECT id FROM srv_providers WHERE owner_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Providers can delete own associations"
    ON srv_trial_associations FOR DELETE
    USING (provider_id IN (SELECT id FROM srv_providers WHERE owner_id = auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE srv_places_cache ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Anyone can view places cache" ON srv_places_cache FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== 005: Monetization flags =====
ALTER TABLE srv_providers ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE srv_providers ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ NULL;
ALTER TABLE srv_trial_associations ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
