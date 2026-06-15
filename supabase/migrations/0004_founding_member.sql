-- ONTURF founding-member badge (private beta hype)
-- Auto-tags the early cohort and lets admins grant/revoke manually.

alter table profiles
  add column if not exists founding_member boolean not null default false;

-- Auto-grant founding status to the first 100 profiles created. After that,
-- new profiles are not founding members (admins can still grant manually).
create or replace function grant_founding_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from profiles) < 100 then
    new.founding_member := true;
  end if;
  return new;
end;
$$;

create trigger profiles_founding_member before insert on profiles
  for each row execute function grant_founding_member();
