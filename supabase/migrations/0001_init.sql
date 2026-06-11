-- ONTURF baseline schema
-- Run in Supabase SQL editor or via `supabase db push`.

-- ENUMS
create type user_role as enum ('artist','producer','engineer','videographer','designer','venue_promoter','fan');
create type show_status as enum ('pending','approved','rejected');

-- PROFILES (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_\.]{3,30}$'),
  display_name text not null,
  bio text check (char_length(bio) <= 500),
  avatar_url text,
  city text not null default 'albuquerque',
  roles user_role[] not null default '{fan}',
  genres text[] default '{}',
  open_to_work boolean default false,
  links jsonb default '{}'::jsonb, -- {instagram, spotify, soundcloud, youtube, website, twitch}
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- VENUES (lightweight, admin/owner-managed; promoters can also just have profiles)
create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null default 'albuquerque',
  address text,
  all_ages boolean default false,
  created_at timestamptz default now()
);

-- SHOWS
create table shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  flyer_url text,
  venue_id uuid references venues(id),
  venue_name_freetext text, -- fallback if venue not in table
  city text not null default 'albuquerque',
  starts_at timestamptz not null,
  price_text text, -- "$10", "free", "$10 adv / $15 door"
  all_ages boolean default false,
  genres text[] default '{}',
  ticket_url text,
  description text check (char_length(description) <= 1000),
  submitted_by uuid references profiles(id),
  status show_status not null default 'pending',
  created_at timestamptz default now()
);

-- SHOW LINEUP (tagged artists on a bill)
create table show_lineup (
  show_id uuid references shows(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  billing_order int default 0,
  primary key (show_id, profile_id)
);

-- CREDITS ("worked with" — track-level collaboration tags)
create table credits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade, -- whose profile this appears on
  credited_id uuid references profiles(id) on delete cascade, -- who is being credited
  role_label text not null, -- 'producer', 'mix engineer', 'feature', etc.
  work_title text not null, -- track/project name
  work_url text, -- spotify/soundcloud link
  confirmed boolean default false, -- credited user can confirm; unconfirmed shows as "unconfirmed"
  created_at timestamptz default now()
);

-- EMBEDS (spotify/soundcloud players on profiles)
create table profile_embeds (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  embed_url text not null, -- raw spotify/soundcloud/youtube URL; render as embed client-side
  sort_order int default 0
);

-- INDEXES
create index shows_status_starts_at_idx on shows (status, starts_at);
create index shows_city_idx on shows (city);
create index show_lineup_profile_idx on show_lineup (profile_id);
create index credits_owner_idx on credits (owner_id);
create index credits_credited_idx on credits (credited_id);
create index profile_embeds_profile_idx on profile_embeds (profile_id);

-- helper: is the current user an admin?
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ============ RLS ============
alter table profiles enable row level security;
alter table venues enable row level security;
alter table shows enable row level security;
alter table show_lineup enable row level security;
alter table credits enable row level security;
alter table profile_embeds enable row level security;

-- PROFILES: anyone can read; users update own row; admins update any; user inserts own row (no self-granted admin)
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert
  with check (auth.uid() = id and is_admin = false);
create policy "profiles_update_own" on profiles for update
  using (auth.uid() = id or is_admin())
  with check (auth.uid() = id or is_admin());
create policy "profiles_delete_admin" on profiles for delete using (is_admin());

-- VENUES: readable by all; insert by authenticated; update by admin
create policy "venues_select_all" on venues for select using (true);
create policy "venues_insert_auth" on venues for insert with check (auth.uid() is not null);
create policy "venues_update_admin" on venues for update using (is_admin());
create policy "venues_delete_admin" on venues for delete using (is_admin());

-- SHOWS: read approved (or own pending, or admin); insert forced pending by submitter; only admins update
create policy "shows_select_approved" on shows for select
  using (status = 'approved' or submitted_by = auth.uid() or is_admin());
create policy "shows_insert_pending" on shows for insert
  with check (auth.uid() = submitted_by and status = 'pending');
create policy "shows_update_admin" on shows for update using (is_admin());
create policy "shows_delete_admin" on shows for delete using (is_admin());

-- SHOW_LINEUP: readable by all; writable by show submitter or admin
create policy "lineup_select_all" on show_lineup for select using (true);
create policy "lineup_insert_submitter" on show_lineup for insert
  with check (
    exists (select 1 from shows s where s.id = show_id and (s.submitted_by = auth.uid() or is_admin()))
  );
create policy "lineup_delete_submitter" on show_lineup for delete
  using (
    exists (select 1 from shows s where s.id = show_id and (s.submitted_by = auth.uid() or is_admin()))
  );

-- CREDITS: readable by all; owner manages rows; credited user can toggle `confirmed` only
create policy "credits_select_all" on credits for select using (true);
create policy "credits_insert_owner" on credits for insert
  with check (auth.uid() = owner_id and confirmed = false);
create policy "credits_update_owner_or_credited" on credits for update
  using (auth.uid() = owner_id or auth.uid() = credited_id)
  with check (auth.uid() = owner_id or auth.uid() = credited_id);
create policy "credits_delete_owner" on credits for delete
  using (auth.uid() = owner_id or auth.uid() = credited_id or is_admin());

-- prevent the owner from flipping `confirmed` themselves; only credited_id may
create or replace function credits_guard()
returns trigger language plpgsql as $$
begin
  if new.confirmed is distinct from old.confirmed and auth.uid() is distinct from old.credited_id then
    raise exception 'only the credited user can confirm a credit';
  end if;
  -- credited user can only change `confirmed`, nothing else
  if auth.uid() = old.credited_id and auth.uid() is distinct from old.owner_id then
    if new.role_label is distinct from old.role_label
       or new.work_title is distinct from old.work_title
       or new.work_url is distinct from old.work_url
       or new.owner_id is distinct from old.owner_id
       or new.credited_id is distinct from old.credited_id then
      raise exception 'credited user can only toggle confirmation';
    end if;
  end if;
  return new;
end;
$$;
create trigger credits_guard_trg before update on credits
  for each row execute function credits_guard();

-- PROFILE_EMBEDS: readable by all; writable by owning user
create policy "embeds_select_all" on profile_embeds for select using (true);
create policy "embeds_insert_own" on profile_embeds for insert with check (auth.uid() = profile_id);
create policy "embeds_update_own" on profile_embeds for update using (auth.uid() = profile_id);
create policy "embeds_delete_own" on profile_embeds for delete using (auth.uid() = profile_id);

-- ============ STORAGE ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('flyers', 'flyers', true, 2097152, array['image/jpeg','image/png','image/webp']);

-- users write into a folder named after their uid: avatars/<uid>/..., flyers/<uid>/...
create policy "avatars_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_write_own" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "flyers_read" on storage.objects for select using (bucket_id = 'flyers');
create policy "flyers_write_own" on storage.objects for insert
  with check (bucket_id = 'flyers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "flyers_delete_own" on storage.objects for delete
  using (bucket_id = 'flyers' and (storage.foldername(name))[1] = auth.uid()::text);
