"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatShowDate, formatShowTime, venueLabel } from "@/lib/utils";
import type { ShowWithVenue } from "@/lib/types";

export default function PendingShowCard({ show }: { show: ShowWithVenue }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    const { error: dbErr } = await createClient()
      .from("shows")
      .update({ status })
      .eq("id", show.id);
    setBusy(false);
    if (dbErr) return setError(dbErr.message.toLowerCase());
    router.refresh();
  }

  return (
    <div className="border border-border bg-surface p-3">
      <div className="flex gap-3">
        {show.flyer_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={show.flyer_url} alt="" className="h-24 w-20 shrink-0 object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs lowercase text-accent">
            {formatShowDate(show.starts_at)} · {formatShowTime(show.starts_at)}
          </p>
          <Link href={`/shows/${show.id}`} className="font-bold text-white underline">
            {show.title}
          </Link>
          <p className="text-sm lowercase text-muted">
            {venueLabel(show)} · {show.price_text ?? "no price"}
            {show.all_ages && " · all ages"}
          </p>
          {show.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted">{show.description}</p>
          )}
        </div>
      </div>
      {/* big tap targets — this gets used from a phone */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setStatus("approved")}
          disabled={busy}
          className="btn-accent flex-1 py-3 disabled:opacity-50"
        >
          approve
        </button>
        <button
          onClick={() => setStatus("rejected")}
          disabled={busy}
          className="btn-ghost flex-1 py-3 disabled:opacity-50"
        >
          reject
        </button>
      </div>
      {error && <p className="mt-2 text-sm lowercase text-accent">{error}</p>}
    </div>
  );
}
