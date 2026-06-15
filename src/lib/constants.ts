import type { AvatarBg, LinkPageConfig, UserRole } from "./types";

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

// ---------------------------------------------------------------------------
// LINK PAGE (/l/<username>) — Linktree-style customizable page
// ---------------------------------------------------------------------------

/** Background palette. `fg` is the contrasting text color for that background. */
export const LINK_PAGE_COLORS: {
  key: string;
  label: string;
  bg: string;
  fg: string;
}[] = [
  { key: "void", label: "void", bg: "#050505", fg: "#f4f4f2" },
  { key: "ash", label: "ash", bg: "#1c1c1c", fg: "#f4f4f2" },
  { key: "slate", label: "slate", bg: "#1f2933", fg: "#f4f4f2" },
  { key: "forest", label: "forest", bg: "#12342a", fg: "#f4f4f2" },
  { key: "ocean", label: "ocean", bg: "#0b2a4a", fg: "#f4f4f2" },
  { key: "violet", label: "violet", bg: "#2a1a4a", fg: "#f4f4f2" },
  { key: "blood", label: "blood", bg: "#ff3b1f", fg: "#0a0a0a" },
  { key: "gold", label: "gold", bg: "#e8b84b", fg: "#0a0a0a" },
  { key: "rose", label: "rose", bg: "#f0a8c0", fg: "#0a0a0a" },
  { key: "bone", label: "bone", bg: "#d9d6cf", fg: "#0a0a0a" },
];

export const LINK_PAGE_COLOR_MAP = Object.fromEntries(
  LINK_PAGE_COLORS.map((c) => [c.key, c])
) as Record<string, (typeof LINK_PAGE_COLORS)[number]>;

/** Background overlay effects. `animated` ones use a single canvas + rAF loop. */
export const LINK_PAGE_EFFECTS: {
  key: string;
  label: string;
  animated: boolean;
}[] = [
  { key: "none", label: "none", animated: false },
  { key: "grain", label: "film grain", animated: false },
  { key: "scanlines", label: "scanlines", animated: false },
  { key: "vignette", label: "vignette", animated: false },
  { key: "aurora", label: "aurora", animated: true },
  { key: "pulse", label: "pulse", animated: true },
  { key: "rain", label: "rain", animated: true },
  { key: "snow", label: "snow", animated: true },
  { key: "static", label: "tv static", animated: true },
  { key: "starfield", label: "starfield", animated: true },
];

export const LINK_PAGE_EFFECT_KEYS = LINK_PAGE_EFFECTS.map((e) => e.key);

export const AVATAR_BG_OPTIONS: { value: AvatarBg; label: string }[] = [
  { value: "off", label: "color" },
  { value: "blur", label: "blurred photo" },
  { value: "pixelate", label: "pixelated photo" },
];

export const MAX_LINK_PAGE_LINKS = 20;

export const DEFAULT_LINK_PAGE: LinkPageConfig = {
  enabled: false,
  bg_color: "void",
  avatar_bg: "off",
  effect: "none",
  links: [],
};

/** Merge a stored (possibly empty/partial) link_page jsonb into a full config. */
export function resolveLinkPage(
  raw: LinkPageConfig | Record<string, never> | null | undefined
): LinkPageConfig {
  const cfg = (raw ?? {}) as Partial<LinkPageConfig>;
  return {
    enabled: cfg.enabled ?? DEFAULT_LINK_PAGE.enabled,
    bg_color: LINK_PAGE_COLOR_MAP[cfg.bg_color ?? ""]
      ? (cfg.bg_color as string)
      : DEFAULT_LINK_PAGE.bg_color,
    avatar_bg: (["off", "blur", "pixelate"] as const).includes(
      cfg.avatar_bg as AvatarBg
    )
      ? (cfg.avatar_bg as AvatarBg)
      : DEFAULT_LINK_PAGE.avatar_bg,
    effect: LINK_PAGE_EFFECT_KEYS.includes(cfg.effect ?? "")
      ? (cfg.effect as string)
      : DEFAULT_LINK_PAGE.effect,
    links: Array.isArray(cfg.links)
      ? cfg.links
          .filter((l) => l && typeof l.url === "string" && l.url.length > 0)
          .slice(0, MAX_LINK_PAGE_LINKS)
      : DEFAULT_LINK_PAGE.links,
  };
}
