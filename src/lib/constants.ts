import type { UserRole } from "./types";

export const SITE_NAME = "ONTURF";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://onturf.com";
export const TAGLINE = "find shows. get found.";
export const DEFAULT_CITY = "albuquerque";

export const ROLES: { value: UserRole; label: string }[] = [
  { value: "artist", label: "artist" },
  { value: "producer", label: "producer" },
  { value: "engineer", label: "engineer" },
  { value: "videographer", label: "videographer" },
  { value: "designer", label: "designer" },
  { value: "venue_promoter", label: "venue / promoter" },
  { value: "fan", label: "fan" },
];

export const ROLE_LABELS: Record<UserRole, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label])
) as Record<UserRole, string>;

export const GENRES = [
  "hip-hop",
  "rap",
  "r&b",
  "punk",
  "hardcore",
  "metal",
  "indie",
  "rock",
  "electronic",
  "house",
  "techno",
  "experimental",
  "folk",
  "country",
  "latin",
  "reggaeton",
  "pop",
  "jazz",
  "funk",
  "soul",
] as const;

export const LINK_KEYS = [
  "instagram",
  "spotify",
  "soundcloud",
  "youtube",
  "website",
  "twitch",
] as const;

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
