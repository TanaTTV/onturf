"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChipPicker from "@/components/ChipPicker";
import { GENRES, LINK_KEYS, ROLES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { resizeImage } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export default function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [roles, setRoles] = useState<string[]>(profile.roles);
  const [genres, setGenres] = useState<string[]>(profile.genres);
  const [openToWork, setOpenToWork] = useState(profile.open_to_work);
  const [links, setLinks] = useState<Record<string, string>>(
    Object.fromEntries(LINK_KEYS.map((k) => [k, (profile.links as Record<string, string>)[k] ?? ""]))
  );
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function uploadAvatar(file: File) {
    setError(null);
    setBusy(true);
    try {
      const blob = await resizeImage(file, 800);
      if (blob.size > MAX_UPLOAD_BYTES) throw new Error("image too large after resize");
      const supabase = createClient();
      const path = `${profile.id}/avatar-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/webp", upsert: true });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", profile.id);
      if (dbErr) throw dbErr;
      setAvatarUrl(publicUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message.toLowerCase() : "upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!displayName.trim()) return setError("display name is required");
    if (roles.length === 0) return setError("pick at least one role");

    setBusy(true);
    const cleanLinks = Object.fromEntries(
      Object.entries(links).filter(([, v]) => v.trim())
    );
    const { error: dbErr } = await createClient()
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        roles,
        genres,
        open_to_work: openToWork,
        links: cleanLinks,
      })
      .eq("id", profile.id);
    setBusy(false);

    if (dbErr) return setError(dbErr.message.toLowerCase());
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-5">
      <h2 className="mono-meta text-white">PROFILE</h2>

      <div className="flex items-center gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="avatar"
            className="h-20 w-20 rounded-full border border-hairline object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline text-muted">
            —
          </div>
        )}
        <label className="btn-text cursor-pointer text-sm">
          {busy ? "…" : "change photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
          />
        </label>
      </div>

      <div>
        <label className="label" htmlFor="display_name">
          display name
        </label>
        <input
          id="display_name"
          className="input"
          maxLength={80}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div>
        <label className="label" htmlFor="bio">
          bio <span className="text-xs">({bio.length}/500)</span>
        </label>
        <textarea
          id="bio"
          className="input min-h-24"
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <div>
        <span className="label">roles</span>
        <ChipPicker options={ROLES} selected={roles} onToggle={(v) => toggle(roles, setRoles, v)} />
      </div>

      <div>
        <span className="label">genres</span>
        <ChipPicker
          options={GENRES.map((g) => ({ value: g, label: g }))}
          selected={genres}
          onToggle={(v) => toggle(genres, setGenres, v)}
        />
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={openToWork}
        onClick={() => setOpenToWork(!openToWork)}
        className="flex min-h-[56px] w-full items-center justify-between border-y border-hairline py-3 text-left"
      >
        <span>
          <span className="mono-meta flex items-center gap-2 text-white">
            {openToWork && <span className="signal-dot" aria-hidden />}
            OPEN TO WORK
          </span>
          <span className="mt-1 block text-sm lowercase text-muted">
            shows a dot on your profile so people know you&apos;re taking gigs
          </span>
        </span>
        <span
          className={`mono-meta px-4 py-2 transition-colors duration-150 ${
            openToWork ? "bg-white text-black" : "text-muted"
          }`}
        >
          {openToWork ? "ON" : "OFF"}
        </span>
      </button>

      <div>
        <span className="label">links</span>
        <div className="flex flex-col gap-2">
          {LINK_KEYS.map((key) => (
            <input
              key={key}
              className="input"
              type="url"
              inputMode="url"
              placeholder={key}
              value={links[key]}
              onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
            />
          ))}
        </div>
      </div>

      {error && <p className="mono-meta-xs text-muted">{error}</p>}
      {saved && <p className="text-sm lowercase text-white">saved.</p>}

      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
        {busy ? "…" : "save profile"}
      </button>
    </form>
  );
}
