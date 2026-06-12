"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountSection({ email }: { email: string }) {
  const router = useRouter();
  const [newEmail, setNewEmail] = useState(email);
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function updateEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setBusy(true);
    const { error: err } = await createClient().auth.updateUser({ email: newEmail });
    setBusy(false);
    if (err) return setError(err.message.toLowerCase());
    setMsg("check both inboxes to confirm the email change.");
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    if (newPassword.length < 8) return setError("password must be at least 8 characters");
    setBusy(true);
    const { error: err } = await createClient().auth.updateUser({ password: newPassword });
    setBusy(false);
    if (err) return setError(err.message.toLowerCase());
    setNewPassword("");
    setMsg("password updated.");
  }

  async function deleteAccount() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      setBusy(false);
      return setError("could not delete account — try again or contact us");
    }
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="border-t border-hairline pt-8">
      <h2 className="mono-meta mb-3 text-white">ACCOUNT</h2>

      <form onSubmit={updateEmail} className="mb-4 flex gap-2">
        <input
          className="input flex-1"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <button type="submit" disabled={busy || newEmail === email} className="btn-text disabled:opacity-50">
          update email
        </button>
      </form>

      <form onSubmit={updatePassword} className="mb-4 flex gap-2">
        <input
          className="input flex-1"
          type="password"
          autoComplete="new-password"
          placeholder="new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button type="submit" disabled={busy || !newPassword} className="btn-text disabled:opacity-50">
          update password
        </button>
      </form>

      {msg && <p className="mb-2 text-sm lowercase text-white">{msg}</p>}
      {error && <p className="mb-2 mono-meta-xs text-muted">{error}</p>}

      <div className="mt-6 border border-hairline p-4">
        <p className="mb-2 text-sm lowercase text-muted">
          deleting your account removes your profile, credits, embeds, and lineup tags. shows
          you submitted stay up.
        </p>
        {confirmingDelete ? (
          <div className="flex gap-2">
            <button onClick={deleteAccount} disabled={busy} className="btn-primary disabled:opacity-50">
              {busy ? "…" : "yes, delete everything"}
            </button>
            <button onClick={() => setConfirmingDelete(false)} className="btn-text">
              cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="lowercase text-muted underline underline-offset-4 hover:text-white">
            delete account
          </button>
        )}
      </div>
    </section>
  );
}
