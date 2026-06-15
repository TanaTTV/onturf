"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LinkPage from "@/components/LinkPage";
import {
  AVATAR_BG_OPTIONS,
  LINK_PAGE_COLORS,
  LINK_PAGE_EFFECTS,
  MAX_LINK_PAGE_LINKS,
  resolveLinkPage,
  SITE_URL,
} from "@/lib/constants";
import { linkPageSchema } from "@/lib/validation";
import type { LinkPageConfig, LinkPageItem, Profile } from "@/lib/types";

export default function LinkPageManager({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [cfg, setCfg] = useState<LinkPageConfig>(() =>
    resolveLinkPage(profile.link_page)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const shareUrl = `${SITE_URL}/l/${profile.username}`;
  const hasAvatar = !!profile.avatar_url;

  const previewProfile = useMemo(
    () => ({
      display_name: profile.display_name,
      username: profile.username,
      avatar_url: profile.avatar_url,
      city: profile.city,
      links: profile.links,
    }),
    [profile]
  );

  function patch(p: Partial<LinkPageConfig>) {
    setSaved(false);
    setCfg((c) => ({ ...c, ...p }));
  }

  function setLink(i: number, key: keyof LinkPageItem, value: string) {
    setSaved(false);
    setCfg((c) => ({
      ...c,
      links: c.links.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)),
    }));
  }

  function addLink() {
    if (cfg.links.length >= MAX_LINK_PAGE_LINKS) return;
    patch({ links: [...cfg.links, { label: "", url: "" }] });
  }

  function removeLink(i: number) {
    patch({ links: cfg.links.filter((_, idx) => idx !== i) });
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= cfg.links.length) return;
    const next = [...cfg.links];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ links: next });
  }

  async function save() {
    setError(null);
    // drop empty rows before validating/saving
    const cleaned: LinkPageConfig = {
      ...cfg,
      links: cfg.links.filter((l) => l.label.trim() || l.url.trim()),
    };
    const parsed = linkPageSchema.safeParse(cleaned);
    if (!parsed.success) {
      return setError(parsed.error.issues[0].message.toLowerCase());
    }
    setBusy(true);
    const { error: dbErr } = await createClient()
      .from("profiles")
      .update({ link_page: parsed.data })
      .eq("id", profile.id);
    setBusy(false);
    if (dbErr) return setError(dbErr.message.toLowerCase());
    setCfg(parsed.data as LinkPageConfig);
    setSaved(true);
    router.refresh();
  }

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mono-meta mb-2 text-white">LINK PAGE</h2>
      <p className="mb-5 text-sm lowercase text-muted">
        a shareable linktree-style page. when live it&apos;s at{" "}
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline underline-offset-4"
        >
          /l/{profile.username}
        </a>
        .
      </p>

      <div className="grid gap-8 md:grid-cols-[1fr_minmax(0,320px)]">
        {/* controls */}
        <div className="flex flex-col gap-6">
          {/* live toggle */}
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm lowercase text-white">
              page is live
              <span className="block text-muted">
                {cfg.enabled ? "anyone with the link can view it" : "only you can view it"}
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={cfg.enabled}
              onClick={() => patch({ enabled: !cfg.enabled })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                cfg.enabled ? "bg-white" : "bg-hairline"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-black transition-transform ${
                  cfg.enabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          {/* background */}
          <div>
            <p className="label">BACKGROUND</p>
            <div className="flex flex-wrap gap-2">
              {LINK_PAGE_COLORS.map((c) => {
                const active = cfg.avatar_bg === "off" && cfg.bg_color === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    title={c.label}
                    onClick={() => patch({ bg_color: c.key, avatar_bg: "off" })}
                    className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                      active ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                    }`}
                    style={{ background: c.bg, border: "1px solid var(--grey-2)" }}
                    aria-label={c.label}
                  />
                );
              })}
            </div>
          </div>

          {/* avatar as background */}
          <div>
            <p className="label">PHOTO BACKDROP</p>
            {!hasAvatar && (
              <p className="mb-2 text-sm lowercase text-muted">
                add an avatar above to use your photo as the background.
              </p>
            )}
            <div className="flex flex-wrap gap-x-1 gap-y-2">
              {AVATAR_BG_OPTIONS.map((o) => {
                const active = cfg.avatar_bg === o.value;
                const disabled = o.value !== "off" && !hasAvatar;
                return (
                  <button
                    key={o.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => patch({ avatar_bg: o.value })}
                    className={`mono-meta min-h-[44px] px-3 transition-colors duration-150 disabled:opacity-30 ${
                      active ? "bg-white text-black" : "text-muted hover:text-white"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* effect */}
          <div>
            <p className="label">EFFECT</p>
            <div className="flex flex-wrap gap-x-1 gap-y-2">
              {LINK_PAGE_EFFECTS.map((e) => {
                const active = cfg.effect === e.key;
                return (
                  <button
                    key={e.key}
                    type="button"
                    onClick={() => patch({ effect: e.key })}
                    className={`mono-meta min-h-[44px] px-3 transition-colors duration-150 ${
                      active ? "bg-white text-black" : "text-muted hover:text-white"
                    }`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* links */}
          <div>
            <p className="label">LINKS</p>
            <p className="mb-3 text-sm lowercase text-muted">
              your profile&apos;s social links show automatically — add anything extra here.
            </p>
            <div className="flex flex-col gap-3">
              {cfg.links.map((l, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <input
                      className="input"
                      placeholder="label (e.g. merch)"
                      value={l.label}
                      maxLength={40}
                      onChange={(e) => setLink(i, "label", e.target.value)}
                    />
                    <input
                      className="input"
                      type="url"
                      inputMode="url"
                      placeholder="https://…"
                      value={l.url}
                      onChange={(e) => setLink(i, "url", e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="px-1 text-muted hover:text-white disabled:opacity-20"
                      aria-label="move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === cfg.links.length - 1}
                      className="px-1 text-muted hover:text-white disabled:opacity-20"
                      aria-label="move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLink(i)}
                      className="px-1 text-muted hover:text-white"
                      aria-label="remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {cfg.links.length < MAX_LINK_PAGE_LINKS && (
              <button type="button" onClick={addLink} className="btn-text mt-2">
                + add link
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={save} disabled={busy} className="btn-primary disabled:opacity-50">
              {busy ? "saving…" : "save link page"}
            </button>
            {saved && <span className="mono-meta-xs text-muted">saved ✓</span>}
            {error && <span className="mono-meta-xs text-signal">{error}</span>}
          </div>
        </div>

        {/* live preview */}
        <div>
          <p className="label">PREVIEW</p>
          <div className="relative h-[560px] overflow-hidden rounded-lg border border-hairline">
            <LinkPage profile={previewProfile} config={cfg} mode="preview" />
          </div>
        </div>
      </div>
    </section>
  );
}
