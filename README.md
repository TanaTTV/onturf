# ONTURF

Local music-scene platform for Albuquerque: a community-submitted show calendar and a
directory of artists, producers, engineers, videographers, designers, and venues.

**find shows. get found.**

## Stack

- Next.js 14 (App Router, TypeScript, edge runtime) + Tailwind CSS
- Supabase — Postgres, Auth (email/password + Google), Storage
- Cloudflare Pages via `@cloudflare/next-on-pages`
- $0/month: everything runs on free tiers

## Setup

1. **Supabase project** — create one at [database.new](https://database.new), then run
   [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) in the SQL editor.
   It creates the schema, RLS policies, and the `avatars` / `flyers` storage buckets.

2. **Auth providers** — in Supabase Dashboard → Authentication:
   - Email/password is on by default.
   - Enable Google: create OAuth credentials in Google Cloud Console, set the redirect URL
     Supabase shows you, paste client ID/secret.
   - Set Site URL to your domain and add `http://localhost:3000` to redirect URLs.

3. **Env** — copy `.env.example` to `.env.local` and fill in the values from
   Supabase Dashboard → Settings → API.

4. **Run**

   ```bash
   npm install
   npm run dev
   ```

5. **Seed sample data** (optional, dev only)

   ```bash
   npm run seed        # 10 venues, 20 profiles, 15 shows over the next 30 days
   npm run seed:wipe   # remove all sample data
   ```

6. **Make yourself admin** — after signing up, in the Supabase SQL editor:

   ```sql
   update profiles set is_admin = true where username = 'your_username';
   ```

## Deploy (Cloudflare Pages)

```bash
npm install -D @cloudflare/next-on-pages
npx @cloudflare/next-on-pages
```

In the Cloudflare Pages dashboard: build command `npx @cloudflare/next-on-pages`,
output directory `.vercel/output/static`, and add the env vars from `.env.local`
(plus the compatibility flag `nodejs_compat`).

## Structure

```
src/app/                routes (App Router)
  /                     landing — next 5 shows
  /shows                calendar list + filters
  /shows/[id]           show detail with lineup
  /shows/submit         submission form (auth, pending status)
  /directory            role/genre filters + search
  /[username]           public profile
  /onboarding           3-step post-signup wizard
  /settings             profile / embeds / credits / account
  /admin                moderation queue (admins only)
src/components/         shared components
src/lib/                supabase clients, types, validation, utils
supabase/migrations/    schema + RLS baseline
scripts/seed.ts         sample data
```

## Post-launch backlog (do not build yet)

Founding-member badge · Song Wars · beat marketplace · featured listings ·
multi-city · PWA + push · email notifications
