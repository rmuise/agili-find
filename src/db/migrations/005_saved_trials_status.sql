-- Add status column to saved_trials for tracking interest level
ALTER TABLE saved_trials ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'interested'
  CHECK (status IN ('interested', 'registered', 'attending'));
