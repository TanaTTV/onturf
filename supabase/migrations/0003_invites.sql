-- ONTURF invite-code access control (private beta)
-- Signup is open at the auth layer, but creating a PROFILE (which is what
-- grants real access) requires redeeming a valid invite code. Enforcement is
-- at the DB so it can't be bypassed by skipping the UI.

create table invite_codes (
  code text primary key,
  label text,                       -- optional note: "twitter drop", "for jay", etc.
  max_uses int not null default 1 check (max_uses >= 1),
  uses int not null default 0,
  expires_at timestamptz,           -- null = never expires
  active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table invite_redemptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text references invite_codes(code) on delete set null,
  redeemed_at timestamptz default now()
);

alter table invite_codes enable row level security;
alter table invite_redemptions enable row level security;

-- invite_codes: admins manage everything; nobody else can read codes
create policy "invites_admin_all" on invite_codes for all
  using (is_admin()) with check (is_admin());

-- redemptions: a user can see their own; admins see all. No direct INSERT
-- policy — redemptions are only written by redeem_invite() (security definer).
create policy "redemptions_select_own_or_admin" on invite_redemptions for select
  using (user_id = auth.uid() or is_admin());

-- redeem a code for the current user (atomic, idempotent)
create or replace function redeem_invite(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v invite_codes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'must be signed in';
  end if;
  -- already redeemed? treat as success so refresh/retry is safe
  if exists (select 1 from invite_redemptions where user_id = auth.uid()) then
    return;
  end if;

  select * into v from invite_codes where code = lower(trim(p_code)) for update;
  if not found then
    raise exception 'invalid invite code';
  end if;
  if not v.active then
    raise exception 'this code is no longer active';
  end if;
  if v.expires_at is not null and v.expires_at < now() then
    raise exception 'this code has expired';
  end if;
  if v.uses >= v.max_uses then
    raise exception 'this code has been fully used';
  end if;

  insert into invite_redemptions (user_id, code) values (auth.uid(), v.code);
  update invite_codes set uses = uses + 1 where code = v.code;
end;
$$;

-- admin-only: generate a fresh unique code
create or replace function create_invite(p_label text default null, p_max_uses int default 1)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  c text;
begin
  if not is_admin() then
    raise exception 'admins only';
  end if;
  loop
    c := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    exit when not exists (select 1 from invite_codes where code = c);
  end loop;
  insert into invite_codes (code, label, max_uses, created_by)
    values (c, nullif(trim(p_label), ''), greatest(1, p_max_uses), auth.uid());
  return c;
end;
$$;

-- Require a redemption before a profile can be created. (To open signups
-- publicly later, drop this policy and restore the simpler insert check.)
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert
  with check (
    auth.uid() = id
    and is_admin = false
    and exists (select 1 from invite_redemptions r where r.user_id = auth.uid())
  );
