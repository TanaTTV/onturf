"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? (mode === "signup" ? "/onboarding" : "/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      setBusy(false);
      if (error) return setError(error.message.toLowerCase());
      if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setNotice("check your email to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message.toLowerCase());
      router.push(next);
      router.refresh();
    }
  }

  async function handleGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          mode === "signup" ? "/onboarding" : next
        )}`,
      },
    });
    if (error) setError(error.message.toLowerCase());
  }

  return (
    <div className="mx-auto mt-14 w-full max-w-sm">
      <h1 className="wordmark mb-10 text-5xl text-white">
        {mode === "login" ? "log in" : "sign up"}
      </h1>

      <button onClick={handleGoogle} className="btn-primary w-full">
        continue with google
      </button>

      <p className="mono-meta-xs my-6 text-muted">OR</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="label" htmlFor="email">
            EMAIL
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            PASSWORD
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="mono-meta-xs flex items-center gap-2 text-muted">
            <span className="signal-dot" aria-hidden />
            {error}
          </p>
        )}
        {notice && <p className="mono-meta-xs text-white">{notice}</p>}

        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? "…" : mode === "login" ? "log in" : "create account"}
        </button>
      </form>

      <p className="mt-8 text-sm lowercase text-muted">
        {mode === "login" ? (
          <>
            new here?{" "}
            <Link href="/signup" className="text-white underline underline-offset-4">
              sign up
            </Link>
          </>
        ) : (
          <>
            already on turf?{" "}
            <Link href="/login" className="text-white underline underline-offset-4">
              log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
