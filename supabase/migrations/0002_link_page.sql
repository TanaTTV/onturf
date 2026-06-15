-- ONTURF link page (Linktree-style shareable page at /l/<username>)
-- Stores the whole config as jsonb on the existing profiles row.
-- Owner-update is already enforced by the profiles RLS policies, so no new
-- tables or policies are needed.

alter table profiles
  add column if not exists link_page jsonb not null default '{}'::jsonb;

-- shape (all keys optional; UI falls back to defaults):
-- {
--   "enabled": boolean,                       -- is the page live
--   "bg_color": text,                         -- palette key (see constants.ts)
--   "avatar_bg": "off" | "blur" | "pixelate", -- use avatar as the backdrop
--   "effect": text,                           -- overlay effect key
--   "links": [{ "label": text, "url": text }] -- custom links, ordered
-- }
