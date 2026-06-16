<div align="center">

# ONTURF

### find shows. get found.

The Albuquerque music scene in one place — a community show calendar and a
directory of the artists, producers, engineers, videographers, designers, and
venues who make it.

[![CI](https://github.com/TanaTTV/onturf/actions/workflows/ci.yml/badge.svg)](https://github.com/TanaTTV/onturf/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-14-000)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ecf8e)
![Cost](https://img.shields.io/badge/cost-%240%2Fmonth-success)
![status](https://img.shields.io/badge/status-private%20beta-ff3b1f)

</div>

---

## What it does

- **🗓️ Shows** — browse a community calendar, filter by genre / all-ages / date, and submit your own shows (admin-approved).
- **🧭 Directory** — find local artists & creators by role and genre; "open to work" flags for collabs and gigs.
- **👤 Profiles** — bio, avatar, genres, social links, music/video embeds, and track-level "worked with" credits.
- **🔗 Link pages** — a free Linktree-style page at `/l/<username>` with 10 backgrounds, 10 background effects, and an optional blurred/pixelated photo backdrop.
- **📨 RSVPs & follows** — "I'm going" on shows, follow artists, and a personalized `/following` feed of upcoming shows.
- **🎟️ Invite-only access** — private-beta gating with admin-managed invite codes (see [Operations](docs/OPERATIONS.md)).
- **⭐ Founding members** — the first 100 profiles are auto-badged.
- **💬 Feedback** — a built-in widget routes feedback to an admin inbox.
- **🛠️ Admin** — moderation queue for shows & profiles, invite codes, and feedback.

## Stack

| | |
|---|---|
| **Framework** | Next.js 14 (App Router, TypeScript, edge runtime) |
| **Styling** | Tailwind CSS |
| **Backend** | Supabase — Postgres, Auth (email + Google), Storage |
| **Hosting** | Cloudflare Pages via `@cloudflare/next-on-pages` |
| **CI** | GitHub Actions — lint, typecheck, build |
| **Cost** | $0/month — everything on free tiers |

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                  # http://localhost:3000
```

**Database** — create a project at [database.new](https://database.new), then run the
migrations in [`supabase/migrations/`](supabase/migrations/) **in order** (`0001` →
`0008`) in the Supabase SQL editor. `0001` builds the schema, RLS policies, and the
`avatars` / `flyers` storage buckets; `0002`–`0008` add link pages, invites,
founding badges, feedback, RSVPs/follows, and security hardening.

**Auth** — in Supabase → Authentication: email/password is on by default; enable
Google (OAuth credentials from Google Cloud), set your Site URL, and add
`http://localhost:3000` to redirect URLs. Recommended: turn on **Leaked password
protection**.

**Seed sample data** (dev only):

```bash
npm run seed        # 10 venues, 20 profiles, 15 shows
npm run seed:wipe   # remove sample data
```

**Become admin & open the gate** — the app ships invite-only, so bootstrap your
first admin + invite code per the [Operations runbook](docs/OPERATIONS.md#bootstrap-the-first-admin).

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` / `seed:wipe` | Sample data in / out |

## Deploy (Cloudflare Pages)

```bash
npm install -D @cloudflare/next-on-pages
npx @cloudflare/next-on-pages
```

In the Pages dashboard: build command `npx @cloudflare/next-on-pages`, output
directory `.vercel/output/static`, the env vars from `.env.local`, and the
`nodejs_compat` compatibility flag.

## Structure

```
src/app/
  /                     landing — next 5 shows
  /shows                calendar + filters
  /shows/[id]           show detail, lineup, RSVP
  /shows/submit         submission form (auth, pending)
  /directory            role/genre filters + search
  /[username]           public profile (follow, credits, embeds)
  /l/[username]         Linktree-style link page
  /following            shows from artists you follow (auth)
  /onboarding           post-signup wizard (invite-gated)
  /settings             profile / link page / embeds / credits / account
  /admin                shows + profiles + invites + feedback (admins only)
src/components/         shared components
src/lib/                supabase clients, types, validation, utils
supabase/migrations/    schema, RLS, and feature migrations (0001–0008)
docs/OPERATIONS.md      admin bootstrap + exit-beta runbook
scripts/seed.ts         sample data
```

## Versioning

`main` is the live branch. Releases are marked with tags/branches — the private
beta launch is pinned at **`v1.0.0-beta`**.

## Roadmap

**Shipped in v1 beta:** link pages · invite-only access · founding badges ·
feedback · RSVPs · follows · CI · security hardening.

**Next:** email/push notifications (RSVP & follow reminders) · richer search ·
venue map · then — Song Wars · beat marketplace · featured listings · multi-city.

See [docs/OPERATIONS.md](docs/OPERATIONS.md) for running the platform and coming
out of beta.
