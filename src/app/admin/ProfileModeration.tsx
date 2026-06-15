"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProfileSearch, { type ProfileHit } from "@/components/ProfileSearch";

export default function ProfileModeration() {
  const router = useRouter();
  const [selected, setSelected] = useState<ProfileHit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function deleteProfile() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    // RLS: delete allowed for admins only
    const { error: dbErr } = await createClient()
      .from("profiles")
      .delete()
      .eq("id", selected.id);
    setBusy(false);
    if (dbErr) return setError(dbErr.message.toLowerCase());
    setDone(`deleted @${selected.username}`);
    setSelected(null);
    router.refresh();
  }

  async function setFounding(value: boolean) {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const { error: dbErr } = await createClient()
      .from("profiles")
      .update({ founding_member: value })
      .eq("id", selected.id);
    setBusy(false);
    if (dbErr) return setError(dbErr.message.toLowerCase());
    setDone(`@${selected.username} ${value ? "is now a founding member" : "is no longer a founding member"}`);
    router.refresh();
  }

  return (
    <section className="border-t border-hairline pt-6">
      <h2 className="mono-meta mb-3 text-white">PROFILE MODERATION</h2>
      <p className="mb-3 text-sm lowercase text-muted">
        search a profile to remove spam. deleting a profile removes their credits, embeds, and
        lineup tags.
      </p>
      <ProfileSearch
        placeholder="search profiles…"
        onSelect={(p) => {
          setSelected(p);
          setDone(null);
        }}
        selectedLabel={selected ? `${selected.display_name} (@${selected.username})` : null}
        onClear={() => setSelected(null)}
      />
      {selected && (
        <div className="mt-3 flex items-center gap-3">
          <Link href={`/${selected.username}`} className="lowercase text-muted underline">
            view profile
          </Link>
          <button
            onClick={() => setFounding(true)}
            disabled={busy}
            className="lowercase text-muted hover:text-white disabled:opacity-50"
          >
            grant founding
          </button>
          <button
            onClick={() => setFounding(false)}
            disabled={busy}
            className="lowercase text-muted hover:text-white disabled:opacity-50"
          >
            revoke founding
          </button>
          <button
            onClick={deleteProfile}
            disabled={busy}
            className="btn-primary disabled:opacity-50"
          >
            {busy ? "…" : "delete profile"}
          </button>
        </div>
      )}
      {error && <p className="mt-2 mono-meta-xs text-muted">{error}</p>}
      {done && <p className="mt-2 text-sm lowercase text-white">{done}</p>}
    </section>
  );
}
