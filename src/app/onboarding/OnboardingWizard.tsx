"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChipPicker from "@/components/ChipPicker";
import { GENRES, LINK_KEYS, ROLES } from "@/lib/constants";
import { usernameSchema } from "@/lib/validation";

export default function OnboardingWizard({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState(
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_.]/g, "").slice(0, 30) ?? ""
  );
  const [genres, setGenres] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fanOnly = roles.length === 1 && roles[0] === "fan";

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function save(withLinks: boolean) {
    setError(null);

    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setStep(2);
      setError(parsed.error.issues[0].message.toLowerCase());
      return;
    }
    if (!displayName.trim()) {
      setStep(2);
      setError("display name is required");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const cleanLinks = withLinks
      ? Object.fromEntries(Object.entries(links).filter(([, v]) => v.trim()))
      : {};

    const { error: insertError } = await supabase.from("profiles").insert({
      id: userId,
      username,
      display_name: displayName.trim(),
      roles: roles.length > 0 ? roles : ["fan"],
      genres,
      links: cleanLinks,
    });
    setBusy(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setStep(2);
        setError("that username is taken — try another");
      } else {
        setError(insertError.message.toLowerCase());
      }
      return;
    }

    router.push(`/${username}`);
    router.refresh();
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md">
      <p className="mb-1 text-xs lowercase text-muted">step {step} of 3</p>
      <div className="mb-6 flex gap-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 ${s <= step ? "bg-white" : "bg-hairline"}`} />
        ))}
      </div>

      {step === 1 && (
        <section>
          <h1 className="wordmark mb-2 text-3xl text-white">what do you do?</h1>
          <p className="mb-4 text-sm lowercase text-muted">pick everything that fits.</p>
          <ChipPicker
            options={ROLES}
            selected={roles}
            onToggle={(v) => toggle(roles, setRoles, v)}
          />
          <button
            className="btn-primary mt-6 w-full disabled:opacity-50"
            disabled={roles.length === 0}
            onClick={() => setStep(2)}
          >
            next
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-4">
          <h1 className="wordmark text-3xl text-white">who are you?</h1>
          <div>
            <label className="label" htmlFor="display_name">
              display name
            </label>
            <input
              id="display_name"
              className="input"
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="your artist / business name"
            />
          </div>
          <div>
            <label className="label" htmlFor="username">
              username
            </label>
            <div className="flex items-center">
              <span className="border-b border-hairline py-2.5 pr-1 text-muted">
                onturf.com/
              </span>
              <input
                id="username"
                className="input"
                maxLength={30}
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
                }
              />
            </div>
          </div>
          {!fanOnly && (
            <div>
              <span className="label">genres (optional)</span>
              <ChipPicker
                options={GENRES.map((g) => ({ value: g, label: g }))}
                selected={genres}
                onToggle={(v) => toggle(genres, setGenres, v)}
              />
            </div>
          )}
          {error && <p className="mono-meta-xs text-muted">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-text flex-1" onClick={() => setStep(1)}>
              back
            </button>
            {fanOnly ? (
              <button className="btn-primary flex-1 disabled:opacity-50" disabled={busy} onClick={() => save(false)}>
                {busy ? "…" : "finish"}
              </button>
            ) : (
              <button className="btn-primary flex-1" onClick={() => setStep(3)}>
                next
              </button>
            )}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-4">
          <h1 className="wordmark text-3xl text-white">your links</h1>
          <p className="text-sm lowercase text-muted">
            onturf points people to where your work lives. all optional.
          </p>
          {LINK_KEYS.map((key) => (
            <div key={key}>
              <label className="label" htmlFor={`link-${key}`}>
                {key}
              </label>
              <input
                id={`link-${key}`}
                className="input"
                type="url"
                inputMode="url"
                placeholder={`https://${key === "website" ? "yoursite.com" : `${key}.com/you`}`}
                value={links[key] ?? ""}
                onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
              />
            </div>
          ))}
          {error && <p className="mono-meta-xs text-muted">{error}</p>}
          <div className="flex gap-2">
            <button className="btn-text flex-1" onClick={() => setStep(2)}>
              back
            </button>
            <button
              className="btn-primary flex-1 disabled:opacity-50"
              disabled={busy}
              onClick={() => save(true)}
            >
              {busy ? "…" : "finish"}
            </button>
          </div>
          <button
            className="text-sm lowercase text-muted underline"
            disabled={busy}
            onClick={() => save(false)}
          >
            skip for now
          </button>
        </section>
      )}
    </div>
  );
}
