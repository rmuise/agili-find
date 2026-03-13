-- Notification preferences table
create table if not exists notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email_entry_close boolean default true,
  email_new_trials boolean default true,
  email_seminars boolean default false,
  search_lat double precision,
  search_lng double precision,
  search_radius_miles integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Notification log (prevent duplicate sends)
create table if not exists notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  notification_type text not null,
  reference_id text not null,
  sent_at timestamptz default now()
);

create index if not exists idx_notification_log_user on notification_log(user_id, notification_type, reference_id);

-- RLS policies
alter table notification_preferences enable row level security;
alter table notification_log enable row level security;

create policy "Users can manage own notification preferences"
  on notification_preferences for all using (auth.uid() = user_id);

create policy "Users can view own notification log"
  on notification_log for select using (auth.uid() = user_id);
