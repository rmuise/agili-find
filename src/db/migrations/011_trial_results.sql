-- Trial results / scores tracking
create table if not exists trial_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  trial_id uuid references trials(id) on delete cascade not null,
  dog_name text not null,
  class_name text not null,
  placement text,
  qualifying boolean,
  score numeric(8,2),
  time_seconds numeric(8,2),
  faults integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trial_results_user on trial_results(user_id);
create index if not exists idx_trial_results_trial on trial_results(trial_id);

-- RLS
alter table trial_results enable row level security;

create policy "Users can manage own results" on trial_results for all using (auth.uid() = user_id);
create policy "Public results are viewable" on trial_results for select using (true);

-- Add TDAA to organizations
insert into organizations (id, name, website_url, scraper_status) values
  ('tdaa', 'TDAA', 'https://k9tdaa.com', 'active')
on conflict (id) do nothing;
