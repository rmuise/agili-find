-- Session 5D: Monetization feature flags (schema only)
-- Values for tier: 'free' | 'featured' | 'premium'
ALTER TABLE srv_providers ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE srv_providers ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ NULL;

ALTER TABLE srv_trial_associations ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
