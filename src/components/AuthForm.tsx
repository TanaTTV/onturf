"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const onboardingNext = `/onboarding${invite ? `?invite=${encodeURIComponent(invite)}` : ""}`;
  const next = searchParams.get("next") ?? (mode === "signup" ? onboardingNext : "/");
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            onboardingNext
          )}`,
        },
      });
      setBusy(false);
      if (error) return setError(error.message.toLowerCase());
      if (data.session) {
        router.push(onboardingNext);
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
          mode === "signup" ? onboardingNext : next
        )}`,
      },
    });
    if (error) setError(error.message.toLowerCase());
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm sm:mt-24">
      <h1 className="wordmark text-6xl text-white sm:text-7xl">
        {mode === "login" ? "log in" : "sign up"}
      </h1>
      <p className="mono-meta mt-4 text-muted">
        {mode === "login" ? "BACK ON THE TURF" : "GET ON THE ROSTER — ABQ"}
      </p>

      <button onClick={handleGoogle} className="btn-primary mt-12 w-full">
        continue with google
      </button>

      <div className="my-8 flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-hairline" />
        <span className="mono-meta-xs text-muted">OR</span>
        <span className="h-px flex-1 bg-hairline" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

        <button type="submit" disabled={busy} className="btn-primary mt-2 disabled:opacity-50">
          {busy ? "…" : mode === "login" ? "log in" : "claim your spot"}
        </button>
      </form>

      <p className="mt-12 border-t border-hairline pt-6 text-sm lowercase text-muted">
        {mode === "login" ? (
          <>
            not on the roster yet?{" "}
            <Link href="/signup" className="text-white underline underline-offset-4">
              claim your spot
            </Link>
          </>
        ) : (
          <>
            already on the roster?{" "}
            <Link href="/login" className="text-white underline underline-offset-4">
              log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
