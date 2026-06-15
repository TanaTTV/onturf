"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import LinkPageEffects from "./LinkPageEffects";
import { LINK_PAGE_COLOR_MAP } from "@/lib/constants";
import type { LinkPageConfig, LinkPageItem, Profile } from "@/lib/types";

const WHITE = "#f4f4f2";

/** Only allow http(s) links as hrefs — blocks stored javascript:/data: XSS. */
function safeHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

type LinkPageProfile = Pick<
  Profile,
  "display_name" | "username" | "avatar_url" | "city" | "links"
>;

export default function LinkPage({
  profile,
  config,
  mode = "page",
}: {
  profile: LinkPageProfile;
  config: LinkPageConfig;
  mode?: "page" | "preview";
}) {
  const palette = LINK_PAGE_COLOR_MAP[config.bg_color] ?? LINK_PAGE_COLOR_MAP.void;
  const usingPhoto = config.avatar_bg !== "off" && !!profile.avatar_url;
  // over a photo we force white text + a scrim so any palette stays legible
  const fg = usingPhoto ? WHITE : palette.fg;
  const baseBg = usingPhoto ? "#000000" : palette.bg;

  // social links from the main profile, appended after the user's custom links
  const socials: LinkPageItem[] = Object.entries(profile.links ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => ({ label: k, url: v as string }));
  // sanitize every url before it becomes a clickable href (blocks javascript:/data:)
  const items = [...config.links, ...socials]
    .map((it) => ({ label: it.label, href: safeHref(it.url) }))
    .filter((it): it is { label: string; href: string } => !!it.href);

  const positionClass =
    mode === "page" ? "fixed inset-0 z-[60]" : "absolute inset-0";

  return (
    <div
      className={`${positionClass} overflow-y-auto`}
      style={{ background: baseBg, color: fg }}
    >
      {/* background layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {usingPhoto && config.avatar_bg === "blur" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url!}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
          />
        )}
        {usingPhoto && config.avatar_bg === "pixelate" && (
          <PixelBackdrop src={profile.avatar_url!} />
        )}
        {usingPhoto && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.7))",
            }}
          />
        )}
        <LinkPageEffects effect={config.effect} fg={fg} />
      </div>

      {/* content */}
      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col items-center px-6 py-14 text-center">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="h-28 w-28 rounded-full object-cover shadow-lg ring-2 ring-white/15"
          />
        ) : (
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full ring-2 ring-white/15"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <span className="wordmark text-3xl" style={{ color: fg }}>
              {profile.display_name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        )}

        <h1 className="wordmark mt-5 break-words text-3xl sm:text-4xl" style={{ color: fg }}>
          {profile.display_name}
        </h1>
        <p className="mono-meta mt-2 opacity-70" style={{ color: fg }}>
          @{profile.username}
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          {items.length === 0 ? (
            <p className="mono-meta-xs opacity-60" style={{ color: fg }}>
              no links yet
            </p>
          ) : (
            items.map((item, i) => (
              <a
                key={`${item.label}-${i}`}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="lp-btn w-full px-5 py-3.5 text-sm font-bold lowercase transition-colors"
                style={
                  {
                    color: fg,
                    border: `1px solid ${fg}`,
                    "--lp-fg": fg,
                    "--lp-bg": baseBg,
                  } as React.CSSProperties
                }
              >
                {item.label}
              </a>
            ))
          )}
        </div>

        <div className="mt-auto pt-12">
          <Link
            href={`/${profile.username}`}
            className="mono-meta-xs underline-offset-4 opacity-60 hover:underline"
            style={{ color: fg }}
          >
            {profile.username} on ONTURF ↗
          </Link>
        </div>
      </div>

      {/* hover styles for link buttons (inverts to fg fill) */}
      <style>{`
        .lp-btn:hover { background: var(--lp-fg); color: var(--lp-bg) !important; }
      `}</style>
    </div>
  );
}

/** Pixelated avatar backdrop drawn on a canvas (downscale then upscale, no smoothing). */
function PixelBackdrop({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";

    function draw() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      if (!w || !h) return;
      canvas!.width = w;
      canvas!.height = h;
      const cols = 56;
      const rows = Math.max(1, Math.round((cols * h) / w));
      const small = document.createElement("canvas");
      small.width = cols;
      small.height = rows;
      const sctx = small.getContext("2d")!;
      // cover-fit the source into the small canvas
      const ar = img.width / img.height;
      const tar = cols / rows;
      let sw = img.width;
      let sh = img.height;
      let sx = 0;
      let sy = 0;
      if (ar > tar) {
        sw = img.height * tar;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / tar;
        sy = (img.height - sh) / 2;
      }
      sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
      ctx!.imageSmoothingEnabled = false;
      ctx!.clearRect(0, 0, w, h);
      ctx!.drawImage(small, 0, 0, w, h);
    }

    img.onload = draw;
    img.src = src;
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [src]);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}
