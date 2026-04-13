-- Tend — Supabase schema
-- Run this in the Supabase SQL editor to create all tables.

-- Users (extend Supabase auth.users with a public profile)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_emoji text default '🌱',
  ghost_mode boolean default false,
  points_total integer default 0,
  created_at timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users can read all profiles" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- Friendships
create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references public.users(id) on delete cascade,
  user_b uuid references public.users(id) on delete cascade,
  status text check (status in ('pending', 'mutual', 'virtual')) not null default 'virtual',
  connected_at timestamptz,
  created_at timestamptz default now(),
  unique(user_a, user_b)
);
alter table public.friendships enable row level security;
create policy "Users can see own friendships" on public.friendships for select
  using (auth.uid() = user_a or auth.uid() = user_b);
create policy "Users can create friendships" on public.friendships for insert
  with check (auth.uid() = user_a);
create policy "Users can update own friendships" on public.friendships for update
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Plots
create table public.plots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id) on delete cascade,
  friend_id uuid references public.users(id) on delete set null,
  growth_stage text check (growth_stage in ('bare','seedling','growing','thriving','lush')) default 'bare',
  last_tended_at timestamptz,
  drift_state boolean default false,
  pets jsonb default '[]',
  created_at timestamptz default now()
);
alter table public.plots enable row level security;
create policy "Users can see own plots and friend plots" on public.plots for select
  using (auth.uid() = owner_id or auth.uid() = friend_id);
create policy "Users can insert own plots" on public.plots for insert
  with check (auth.uid() = owner_id);
create policy "Users can update own plots" on public.plots for update
  using (auth.uid() = owner_id);

-- Tend actions
create table public.tend_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete cascade,
  action_type text not null,
  points_earned integer not null,
  created_at timestamptz default now()
);
alter table public.tend_actions enable row level security;
create policy "Users can see own actions" on public.tend_actions for select
  using (auth.uid() = actor_id);
create policy "Users can insert own actions" on public.tend_actions for insert
  with check (auth.uid() = actor_id);

-- Gifts
create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.users(id) on delete cascade,
  receiver_id uuid references public.users(id) on delete cascade,
  plot_id uuid references public.plots(id) on delete cascade,
  item_type text not null,
  delivered_at timestamptz default now(),
  found_at timestamptz
);
alter table public.gifts enable row level security;
create policy "Users can see own gifts (sent or received)" on public.gifts for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send gifts" on public.gifts for insert
  with check (auth.uid() = sender_id);
create policy "Receivers can mark gifts found" on public.gifts for update
  using (auth.uid() = receiver_id);

-- Reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  friend_id uuid references public.users(id) on delete cascade,
  type text check (type in ('birthday','anniversary','checkin')) not null,
  label text,
  reminder_date date,
  cadence text check (cadence in ('daily','weekly','biweekly','monthly','never')),
  lead_days integer default 3,
  preferred_time_of_day time,
  created_at timestamptz default now()
);
alter table public.reminders enable row level security;
create policy "Users can manage own reminders" on public.reminders for all
  using (auth.uid() = user_id);

-- User locations (one row per user, upserted on app open)
create table public.user_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade unique,
  lat decimal(10,8) not null,
  lng decimal(11,8) not null,
  logged_at timestamptz default now()
);
alter table public.user_locations enable row level security;
create policy "Users can see friend locations" on public.user_locations for select using (true);
create policy "Users can upsert own location" on public.user_locations for insert
  with check (auth.uid() = user_id);
create policy "Users can update own location" on public.user_locations for update
  using (auth.uid() = user_id);

-- Statuses
create table public.statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text check (type in ('hangout','coffee','watch_party','gaming','phone_call','walk')) not null,
  capacity integer,
  capacity_remaining integer,
  description text,
  time_horizon text check (time_horizon in ('now','in_30','in_1hr')),
  rsvp_url text,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);
alter table public.statuses enable row level security;
create policy "Users can see all active statuses" on public.statuses for select
  using (expires_at > now());
create policy "Users can create own statuses" on public.statuses for insert
  with check (auth.uid() = user_id);
create policy "Users can update own statuses" on public.statuses for update
  using (auth.uid() = user_id);

-- RSVPs
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  status_id uuid references public.statuses(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(status_id, user_id)
);
alter table public.rsvps enable row level security;
create policy "Users can see rsvps for statuses they can see" on public.rsvps for select using (true);
create policy "Users can rsvp" on public.rsvps for insert
  with check (auth.uid() = user_id);
create policy "Users can un-rsvp" on public.rsvps for delete
  using (auth.uid() = user_id);

-- Enable realtime for live-updating tables
alter publication supabase_realtime add table public.user_locations;
alter publication supabase_realtime add table public.statuses;
alter publication supabase_realtime add table public.tend_actions;
