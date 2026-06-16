-- ONTURF feedback inbox (private beta)
-- Logged-in users can submit feedback from anywhere; only admins can read it.

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  message text not null check (char_length(message) between 1 and 2000),
  path text,                         -- page the feedback was sent from
  created_at timestamptz default now()
);

create index feedback_created_idx on feedback (created_at desc);

alter table feedback enable row level security;

-- authenticated users submit feedback for themselves (or anonymously)
create policy "feedback_insert_auth" on feedback for insert
  with check (auth.uid() is not null and (user_id is null or user_id = auth.uid()));
-- only admins can read / clear feedback
create policy "feedback_select_admin" on feedback for select using (is_admin());
create policy "feedback_delete_admin" on feedback for delete using (is_admin());
