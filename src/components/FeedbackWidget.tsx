"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // only show for signed-in users (beta testers)
  useEffect(() => {
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setUserId(data.user?.id ?? null);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!userId) return null;

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!message.trim()) return setError("write something first");
    setBusy(true);
    const { error: dbErr } = await createClient().from("feedback").insert({
      user_id: userId,
      message: message.trim(),
      path: pathname,
    });
    setBusy(false);
    if (dbErr) return setError(dbErr.message.toLowerCase());
    setSent(true);
    setMessage("");
    setTimeout(() => {
      setSent(false);
      setOpen(false);
    }, 1400);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[90] print:hidden">
      {open ? (
        <div className="w-[min(20rem,calc(100vw-2rem))] border border-hairline bg-ink p-4 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="mono-meta text-white">SEND FEEDBACK</span>
            <button
              onClick={() => setOpen(false)}
              className="text-muted hover:text-white"
              aria-label="close"
            >
              ✕
            </button>
          </div>
          {sent ? (
            <p className="py-6 text-center text-sm lowercase text-white">thanks — got it.</p>
          ) : (
            <form onSubmit={send} className="flex flex-col gap-3">
              <textarea
                className="input min-h-24"
                autoFocus
                maxLength={2000}
                placeholder="a bug, an idea, anything…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {error && <p className="mono-meta-xs text-signal">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
                {busy ? "…" : "send"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="mono-meta border border-hairline bg-ink px-4 py-2.5 text-white shadow-lg transition-colors hover:bg-background"
        >
          FEEDBACK
        </button>
      )}
    </div>
  );
}
