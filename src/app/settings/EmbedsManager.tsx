"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { embedSchema } from "@/lib/validation";
import type { ProfileEmbed } from "@/lib/types";

export default function EmbedsManager({
  embeds,
  userId,
}: {
  embeds: ProfileEmbed[];
  userId: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = embedSchema.safeParse({ embed_url: url });
    if (!parsed.success) return setError(parsed.error.issues[0].message.toLowerCase());
    if (embeds.length >= 5) return setError("max 5 embeds — remove one first");

    setBusy(true);
    const { error: dbErr } = await createClient().from("profile_embeds").insert({
      profile_id: userId,
      embed_url: parsed.data.embed_url,
      sort_order: embeds.length,
    });
    setBusy(false);
    if (dbErr) return setError(dbErr.message.toLowerCase());
    setUrl("");
    router.refresh();
  }

  async function remove(id: string) {
    await createClient().from("profile_embeds").delete().eq("id", id);
    router.refresh();
  }

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mono-meta mb-2 text-white">MUSIC & VIDEO EMBEDS</h2>
      <p className="mb-3 text-sm lowercase text-muted">
        paste a spotify, soundcloud, or youtube link — it renders as a player on your profile.
      </p>

      <div className="flex flex-col gap-2">
        {embeds.map((e) => (
          <div key={e.id} className="flex min-h-[44px] items-center gap-2 border-t border-hairline py-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-muted">{e.embed_url}</span>
            <button onClick={() => remove(e.id)} className="lowercase text-muted hover:text-white">
              remove
            </button>
          </div>
        ))}
        {embeds.length === 0 && (
          <p className="text-sm lowercase text-muted">no embeds yet.</p>
        )}
      </div>

      <form onSubmit={add} className="mt-3 flex gap-2">
        <input
          className="input flex-1"
          type="url"
          inputMode="url"
          placeholder="https://open.spotify.com/track/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          add
        </button>
      </form>
      {error && <p className="mt-2 mono-meta-xs text-muted">{error}</p>}
    </section>
  );
}
