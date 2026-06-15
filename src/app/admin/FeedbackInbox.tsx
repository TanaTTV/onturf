"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Feedback } from "@/lib/types";

export default function FeedbackInbox() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await createClient()
      .from("feedback")
      .select("*, author:profiles!feedback_user_id_fkey(username, display_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems((data ?? []) as Feedback[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function dismiss(id: string) {
    await createClient().from("feedback").delete().eq("id", id);
    setItems((cur) => cur.filter((f) => f.id !== id));
  }

  return (
    <section className="border-t border-hairline pt-6">
      <h2 className="mono-meta mb-4 text-white">FEEDBACK ({items.length})</h2>
      {loading ? (
        <p className="mono-meta py-6 text-muted">LOADING…</p>
      ) : items.length === 0 ? (
        <p className="mono-meta border-y border-hairline py-10 text-muted">NO FEEDBACK YET</p>
      ) : (
        <div className="border-t border-hairline">
          {items.map((f) => (
            <div key={f.id} className="border-b border-hairline py-3 text-sm">
              <p className="whitespace-pre-line text-white">{f.message}</p>
              <div className="mono-meta-xs mt-1.5 flex flex-wrap items-center gap-x-3 text-muted">
                <span>
                  {f.author ? `@${f.author.username}` : "anon"} —{" "}
                  {new Date(f.created_at).toLocaleString("en-US", {
                    timeZone: "America/Denver",
                  })}
                </span>
                {f.path && <span>{f.path}</span>}
                <button
                  onClick={() => dismiss(f.id)}
                  className="ml-auto lowercase hover:text-white"
                >
                  dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
