"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/constants";
import type { InviteCode } from "@/lib/types";

export default function InviteCodesManager({ codes }: { codes: InviteCode[] }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: rpcErr } = await createClient().rpc("create_invite", {
      p_label: label.trim() || null,
      p_max_uses: maxUses,
    });
    setBusy(false);
    if (rpcErr) return setError(rpcErr.message.toLowerCase());
    setLabel("");
    setMaxUses(1);
    router.refresh();
  }

  async function toggleActive(code: InviteCode) {
    await createClient()
      .from("invite_codes")
      .update({ active: !code.active })
      .eq("code", code.code);
    router.refresh();
  }

  async function copyLink(code: string) {
    await navigator.clipboard.writeText(`${SITE_URL}/signup?invite=${code}`);
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 1500);
  }

  return (
    <section>
      <h2 className="mono-meta mb-4 text-white">INVITE CODES ({codes.length})</h2>

      <form onSubmit={generate} className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label" htmlFor="invite-label">
            label (optional)
          </label>
          <input
            id="invite-label"
            className="input"
            placeholder="e.g. flyer drop"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="w-20">
          <label className="label" htmlFor="invite-uses">
            uses
          </label>
          <input
            id="invite-uses"
            className="input"
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "…" : "generate"}
        </button>
      </form>
      {error && <p className="mono-meta-xs mb-3 text-signal">{error}</p>}

      {codes.length === 0 ? (
        <p className="mono-meta border-y border-hairline py-10 text-muted">
          NO CODES YET
        </p>
      ) : (
        <div className="border-t border-hairline">
          {codes.map((c) => {
            const used = c.uses >= c.max_uses;
            const expired = c.expires_at != null && new Date(c.expires_at) < new Date();
            const dead = !c.active || used || expired;
            return (
              <div
                key={c.code}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-hairline py-3 text-sm"
              >
                <span
                  className={`font-mono tracking-widest ${dead ? "text-muted line-through" : "text-white"}`}
                >
                  {c.code}
                </span>
                <span className="mono-meta-xs text-muted">
                  {c.uses}/{c.max_uses} used
                  {c.label ? ` — ${c.label}` : ""}
                  {!c.active ? " — revoked" : expired ? " — expired" : ""}
                </span>
                <div className="ml-auto flex items-center gap-4">
                  <button
                    onClick={() => copyLink(c.code)}
                    className="lowercase text-muted hover:text-white"
                  >
                    {copied === c.code ? "copied" : "copy link"}
                  </button>
                  <button
                    onClick={() => toggleActive(c)}
                    className="lowercase text-muted hover:text-white"
                  >
                    {c.active ? "revoke" : "restore"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
