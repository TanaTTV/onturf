-- ONTURF security hardening
-- Fixes a privilege-escalation hole: the profiles update policy allows a user
-- to update their own row, with no guard on the is_admin column — so any user
-- could set is_admin = true on themselves. Lock it down with a trigger that
-- only lets an existing admin change admin status.

create or replace function profiles_protect_privileged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not is_admin() then
    raise exception 'cannot change admin status';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged_trg before update on profiles
  for each row execute function profiles_protect_privileged();
