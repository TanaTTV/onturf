# ONTURF — Operations Runbook

Everything you need to run the platform and, when you're ready, take it out of
private beta. Most steps are run in **Supabase → SQL Editor** (or the in-app
`/admin` panel once you're an admin).

---

## Migrations

Apply in order in the Supabase SQL editor. `0001` is the baseline; the rest are
additive feature/security migrations.

| File | What it adds |
|---|---|
| `0001_init.sql` | Schema, RLS, `avatars`/`flyers` buckets |
| `0002_link_page.sql` | `profiles.link_page` jsonb (link pages) |
| `0003_invites.sql` | Invite codes + redemptions; profile-insert gate |
| `0004_founding_member.sql` | `founding_member` column + first-100 auto-grant |
| `0005_feedback.sql` | Feedback table + RLS |
| `0006_rsvps_follows.sql` | `show_rsvps` + `follows` tables |
| `0007_security_hardening.sql` | Trigger blocking `is_admin` self-escalation |
| `0008_advisor_hardening.sql` | `search_path` pins, RPC revokes, FK indexes |

---

## Bootstrap the first admin

The app ships **invite-only**, and a security trigger blocks anyone from making
themselves an admin via the app. So the very first admin must be set manually.
The trigger also blocks direct `is_admin` updates, so disable it for just this one
change:

```sql
-- grant the first admin + create a starter invite code
alter table profiles disable trigger profiles_protect_privileged_trg;
update profiles set is_admin = true where username = 'YOUR_USERNAME';
alter table profiles enable trigger profiles_protect_privileged_trg;

insert into invite_codes (code, label, max_uses) values ('founder01','beta bootstrap',100);
```

After this, do everything else from the in-app `/admin` panel.

> If you haven't created your profile yet: the invite gate needs a code first.
> Run the `insert into invite_codes …` line above, sign up at
> `/signup?invite=founder01`, then run the `update … is_admin` block.

---

## Day-to-day admin (`/admin`)

- **Shows** — approve/reject the pending submission queue.
- **Invite codes** — generate (with label + max uses), revoke/restore, copy
  share links (`/signup?invite=CODE`). Codes can also be made in SQL via
  `select create_invite('label', 25);` (admin-only).
- **Profiles** — search to remove spam; grant/revoke founding-member status.
- **Feedback** — read and dismiss user feedback.

Granting founding status to someone after the first 100:

```sql
update profiles set founding_member = true where username = 'SOMEONE';
```

---

## Auth hardening (one-time, dashboard)

- **Authentication → Providers/Policies → enable "Leaked password protection"**
  (checks new passwords against HaveIBeenPwned).
- Confirm **Site URL** and **Redirect URLs** match production + `localhost:3000`.

---

## Coming out of beta

When you're ready to go public, these are the changes. Each is small and
independent — do one or all.

### 1. Open signups (anyone can join)

Replace the invite-gated profile-insert policy with the open one:

```sql
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles for insert
  with check (auth.uid() = id and is_admin = false);
```

Then remove the gate from the UI — in `src/app/onboarding/page.tsx`, delete the
redemption check + `<InviteGate />` return so the wizard always shows:

```tsx
// delete these lines:
const { data: redemption } = await supabase
  .from("invite_redemptions").select("user_id").eq("user_id", user.id).maybeSingle();
if (!redemption) return <InviteGate />;
```

(Invite codes still work and do no harm; you can keep them for VIP flows or drop
the `invite_codes` / `invite_redemptions` tables later.)

### 2. Stop auto-badging founding members

The first-100 auto-grant lives in the `grant_founding_member` trigger. To freeze
the cohort, drop the trigger (existing badges stay):

```sql
drop trigger if exists profiles_founding_member on profiles;
```

### 3. Optional cleanup

- **Feedback widget** — keep it (it's useful post-beta too) or remove
  `<FeedbackWidget />` from `src/app/layout.tsx`.
- **"PRIVATE BETA" copy** — only appears in `src/components/InviteGate.tsx`,
  which is no longer rendered once signups are open.

> Want this as a one-click change? There's a pre-built **"exit beta" PR** that
> bundles the signup-opening migration + code change — merge it when ready.

---

## Versioning

- `main` is always the live branch — don't rename it.
- Mark releases with a tag/branch + a GitHub Release. The beta launch is pinned
  at **`v1.0.0-beta`**. For the public launch, cut `v1.0.0` from `main`
  (GitHub → Releases → Draft new release → new tag `v1.0.0`).

---

## Safety notes

- The service-role key is server-only (`SUPABASE_SERVICE_ROLE_KEY`, never
  `NEXT_PUBLIC_*`). Keep it out of client code.
- `profiles_protect_privileged_trg` is what stops users self-granting admin —
  only disable it briefly for manual admin changes, and always re-enable it.
- User-supplied URLs are sanitized to http(s) before render; keep using
  `safeExternalUrl()` for any new outbound links.
