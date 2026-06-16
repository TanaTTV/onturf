-- ONTURF advisor hardening (from Supabase security/performance linter)

-- 1) pin search_path on the two base-schema functions that were missing it
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function credits_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.confirmed is distinct from old.confirmed and auth.uid() is distinct from old.credited_id then
    raise exception 'only the credited user can confirm a credit';
  end if;
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

-- 2) trigger-only functions must never be callable via the REST RPC endpoint
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.credits_guard() from public, anon, authenticated;
revoke execute on function public.grant_founding_member() from public, anon, authenticated;
revoke execute on function public.profiles_protect_privileged() from public, anon, authenticated;

-- 3) covering indexes for foreign keys
create index if not exists feedback_user_idx on feedback (user_id);
create index if not exists invite_codes_created_by_idx on invite_codes (created_by);
create index if not exists invite_redemptions_code_idx on invite_redemptions (code);
create index if not exists shows_submitted_by_idx on shows (submitted_by);
create index if not exists shows_venue_idx on shows (venue_id);
