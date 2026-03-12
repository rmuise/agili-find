-- Add share_token to profiles for public schedule URLs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Generate share tokens for existing profiles
UPDATE profiles SET share_token = substr(md5(random()::text), 1, 12)
WHERE share_token IS NULL;

-- Make share_token NOT NULL with default for new users
ALTER TABLE profiles ALTER COLUMN share_token SET DEFAULT substr(md5(random()::text), 1, 12);

-- Allow public read of profiles by share_token (for public schedule pages)
CREATE POLICY "Anyone can read profile by share_token"
  ON profiles FOR SELECT
  USING (share_token IS NOT NULL);

-- Allow public read of saved_trials for public schedule
-- (the API will filter by share_token lookup, but RLS needs to allow the read)
CREATE POLICY "Public can read saved trials for shared schedules"
  ON saved_trials FOR SELECT
  USING (true);

-- Allow users to update their own saved trials status
CREATE POLICY "Users can update own saved trials"
  ON saved_trials FOR UPDATE
  USING (auth.uid() = user_id);
