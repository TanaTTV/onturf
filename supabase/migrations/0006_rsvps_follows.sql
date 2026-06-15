-- ONTURF engagement loop: show RSVPs + artist follows

-- "I'm going" on shows
create table show_rsvps (
  show_id uuid references shows(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (show_id, profile_id)
);
create index show_rsvps_profile_idx on show_rsvps (profile_id);

-- follow another profile
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on follows (following_id);

alter table show_rsvps enable row level security;
alter table follows enable row level security;

-- RSVPs: anyone can read (counts); users manage their own
create policy "rsvps_select_all" on show_rsvps for select using (true);
create policy "rsvps_insert_own" on show_rsvps for insert with check (auth.uid() = profile_id);
create policy "rsvps_delete_own" on show_rsvps for delete using (auth.uid() = profile_id);

-- Follows: anyone can read (counts); users manage their own follow rows
create policy "follows_select_all" on follows for select using (true);
create policy "follows_insert_own" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete_own" on follows for delete using (auth.uid() = follower_id);
