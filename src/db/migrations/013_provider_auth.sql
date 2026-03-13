-- Expand role constraint to support provider role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'attendee', 'provider', 'admin'));

-- Add owner_id to srv_providers so we can enforce ownership via auth
ALTER TABLE srv_providers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_srv_providers_owner ON srv_providers(owner_id);

-- RLS write policies for srv_providers
CREATE POLICY "Providers can insert own profile"
  ON srv_providers FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Providers can update own profile"
  ON srv_providers FOR UPDATE
  USING (auth.uid() = owner_id);

-- RLS write policies for srv_trial_associations
-- Providers can manage associations for their own provider record
CREATE POLICY "Providers can insert own associations"
  ON srv_trial_associations FOR INSERT
  WITH CHECK (
    provider_id IN (SELECT id FROM srv_providers WHERE owner_id = auth.uid())
  );

CREATE POLICY "Providers can delete own associations"
  ON srv_trial_associations FOR DELETE
  USING (
    provider_id IN (SELECT id FROM srv_providers WHERE owner_id = auth.uid())
  );

-- Allow public read on srv_places_cache
ALTER TABLE srv_places_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view places cache" ON srv_places_cache FOR SELECT USING (true);
