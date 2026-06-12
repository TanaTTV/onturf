"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProfileSearch from "@/components/ProfileSearch";
import { creditSchema } from "@/lib/validation";
import type { Credit } from "@/lib/types";

type CreditRow = Credit & {
  credited: { username: string; display_name: string } | null;
};

export default function CreditsManager({
  credits,
  userId,
}: {
  credits: CreditRow[];
  userId: string;
}) {
  const router = useRouter();
  const [creditedId, setCreditedId] = useState<string | null>(null);
  const [creditedName, setCreditedName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [workUrl, setWorkUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!creditedId) return setError("search and pick the person you worked with");
    if (creditedId === userId) return setError("you can't credit yourself");
    const parsed = creditSchema.safeParse({
      credited_username: creditedName,
      role_label: roleLabel,
      work_title: workTitle,
      work_url: workUrl,
    });
    if (!parsed.success) return setError(parsed.error.issues[0].message.toLowerCase());

    setBusy(true);
    const { error: dbErr } = await createClient().from("credits").insert({
      owner_id: userId,
      credited_id: creditedId,
      role_label: parsed.data.role_label,
      work_title: parsed.data.work_title,
      work_url: parsed.data.work_url || null,
    });
    setBusy(false);
    if (dbErr) return setError(dbErr.message.toLowerCase());
    setCreditedId(null);
    setCreditedName("");
    setRoleLabel("");
    setWorkTitle("");
    setWorkUrl("");
    router.refresh();
  }

  async function remove(id: string) {
    await createClient().from("credits").delete().eq("id", id);
    router.refresh();
  }

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mono-meta mb-2 text-white">WORKED WITH</h2>
      <p className="mb-3 text-sm lowercase text-muted">
        credit people you&apos;ve worked with on tracks or projects. they can confirm it from
        their profile.
      </p>

      <div className="flex flex-col gap-2">
        {credits.map((c) => (
          <div key={c.id} className="flex min-h-[44px] items-center gap-2 border-t border-hairline py-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-white">
              {c.work_title}{" "}
              <span className="lowercase text-muted">
                — {c.role_label}: {c.credited?.display_name ?? "?"}{" "}
                {c.confirmed ? "✓" : "(unconfirmed)"}
              </span>
            </span>
            <button onClick={() => remove(c.id)} className="lowercase text-muted hover:text-white">
              remove
            </button>
          </div>
        ))}
        {credits.length === 0 && <p className="text-sm lowercase text-muted">no credits yet.</p>}
      </div>

      <form onSubmit={add} className="mt-3 flex flex-col gap-2">
        <ProfileSearch
          placeholder="who did you work with? (search by name)"
          excludeId={userId}
          onSelect={(p) => {
            setCreditedId(p.id);
            setCreditedName(p.username);
          }}
          selectedLabel={creditedName ? `@${creditedName}` : null}
          onClear={() => {
            setCreditedId(null);
            setCreditedName("");
          }}
        />
        <input
          className="input"
          placeholder="their role (producer, mix engineer, feature…)"
          maxLength={40}
          value={roleLabel}
          onChange={(e) => setRoleLabel(e.target.value)}
        />
        <input
          className="input"
          placeholder="track / project name"
          maxLength={120}
          value={workTitle}
          onChange={(e) => setWorkTitle(e.target.value)}
        />
        <input
          className="input"
          type="url"
          inputMode="url"
          placeholder="link to the work (optional)"
          value={workUrl}
          onChange={(e) => setWorkUrl(e.target.value)}
        />
        {error && <p className="mono-meta-xs text-muted">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "…" : "add credit"}
        </button>
      </form>
    </section>
  );
}
