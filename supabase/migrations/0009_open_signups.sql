-- Exit private beta: open signups to everyone.
-- Replaces the invite-gated profile-insert policy with the open one. Invite
-- codes still work (and do no harm) but are no longer required to join.

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert
  with check (auth.uid() = id and is_admin = false);
