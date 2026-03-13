-- Extend profiles with display info
alter table profiles add column if not exists bio text;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists dogs text;
alter table profiles add column if not exists is_public boolean default true;

-- Follows table
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references auth.users(id) on delete cascade not null,
  following_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id),
  check(follower_id != following_id)
);

create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);

-- Trial reviews / results sharing
create table if not exists trial_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trial_id uuid references trials(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  results text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, trial_id)
);

create index if not exists idx_trial_reviews_trial on trial_reviews(trial_id);

-- RLS
alter table follows enable row level security;
alter table trial_reviews enable row level security;

create policy "Anyone can view follows" on follows for select using (true);
create policy "Users can manage own follows" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can delete own follows" on follows for delete using (auth.uid() = follower_id);

create policy "Anyone can view trial reviews" on trial_reviews for select using (true);
create policy "Users can manage own reviews" on trial_reviews for all using (auth.uid() = user_id);
