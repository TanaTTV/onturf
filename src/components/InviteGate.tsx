"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function InviteGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);

  async function attempt(raw: string) {
    const value = raw.trim().toLowerCase();
    if (!value) {
      setError("enter your invite code");
      return;
    }
    setError(null);
    setBusy(true);
    const { error: rpcErr } = await createClient().rpc("redeem_invite", {
      p_code: value,
    });
    setBusy(false);
    if (rpcErr) return setError(rpcErr.message.toLowerCase());
    // redemption now exists — page.tsx will show the onboarding wizard
    router.refresh();
  }

  // prefill + auto-redeem when arriving via an invite link (?invite=…)
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    const fromUrl = new URLSearchParams(window.location.search).get("invite");
    if (fromUrl) {
      setCode(fromUrl);
      attempt(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redeem(e: React.FormEvent) {
    e.preventDefault();
    attempt(code);
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm sm:mt-24">
      <p className="mono-meta mb-3 text-muted">PRIVATE BETA</p>
      <h1 className="wordmark text-5xl text-white sm:text-6xl">invite only</h1>
      <p className="mt-4 text-sm lowercase text-muted">
        onturf is in private beta. enter your invite code to claim your spot.
      </p>

      <form onSubmit={redeem} className="mt-10 flex flex-col gap-6">
        <div>
          <label className="label" htmlFor="invite">
            INVITE CODE
          </label>
          <input
            id="invite"
            className="input font-mono tracking-widest"
            autoFocus
            autoComplete="off"
            placeholder="xxxxxxxx"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
          />
        </div>

        {error && (
          <p className="mono-meta-xs flex items-center gap-2 text-muted">
            <span className="signal-dot" aria-hidden />
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "…" : "unlock"}
        </button>
      </form>

      <p className="mt-12 border-t border-hairline pt-6 text-sm lowercase text-muted">
        don&apos;t have a code? hit up someone already on the turf — every member
        can share invites soon.
      </p>
    </div>
  );
}
