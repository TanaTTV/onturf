"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ChipPicker from "@/components/ChipPicker";
import { GENRES, LINK_KEYS, ROLES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { resizeImage } from "@/lib/utils";
import { usernameSchema } from "@/lib/validation";

type UsernameStatus =
  | "idle"
  | "invalid"
  | "checking"
  | "available"
  | "taken"
  | "error";

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
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [bio, setBio] = useState("");
  const [openToWork, setOpenToWork] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fanOnly = roles.length === 1 && roles[0] === "fan";
  const totalSteps = fanOnly ? 2 : 3;

  // live username availability check (debounced)
  useEffect(() => {
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) {
      setUsernameStatus(username ? "invalid" : "idle");
      return;
    }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      const { data, error: qErr } = await createClient()
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();
      if (qErr) setUsernameStatus("error");
      else setUsernameStatus(data ? "taken" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const canLeaveIdentity =
    displayName.trim().length > 0 &&
    (usernameStatus === "available" || usernameStatus === "error");

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function uploadAvatar(file: File) {
    setError(null);
    setUploading(true);
    try {
      const blob = await resizeImage(file, 800);
      if (blob.size > MAX_UPLOAD_BYTES) throw new Error("image too large after resize");
      const supabase = createClient();
      const path = `${userId}/avatar-${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/webp", upsert: true });
      if (upErr) throw upErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message.toLowerCase() : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(withDetails: boolean) {
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
    const cleanLinks = withDetails
      ? Object.fromEntries(Object.entries(links).filter(([, v]) => v.trim()))
      : {};

    const { error: insertError } = await createClient().from("profiles").insert({
      id: userId,
      username,
      display_name: displayName.trim(),
      roles: roles.length > 0 ? roles : ["fan"],
      genres: withDetails ? genres : [],
      bio: withDetails && bio.trim() ? bio.trim() : null,
      open_to_work: withDetails ? openToWork : false,
      links: cleanLinks,
      avatar_url: avatarUrl,
    });
    setBusy(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setStep(2);
        setUsernameStatus("taken");
        setError("that username is taken — try another");
      } else {
        setError(insertError.message.toLowerCase());
      }
      return;
    }

    router.refresh();
    setStep(4); // success screen
  }

  // ---- success screen ----
  if (step === 4) {
    return (
      <div className="mx-auto mt-10 w-full max-w-md text-center">
        {avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="mx-auto h-24 w-24 rounded-full border border-hairline object-cover"
          />
        )}
        <h1 className="wordmark mt-6 text-4xl text-white">you&apos;re in.</h1>
        <p className="mt-2 text-sm lowercase text-muted">
          welcome to onturf, {displayName.trim()}. here&apos;s where to go next.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/${username}`} className="btn-primary w-full">
            view your profile
          </Link>
          <Link href="/settings" className="btn-text">
            set up your link page ↗
          </Link>
          <Link href="/shows" className="btn-text">
            browse upcoming shows ↗
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md">
      <p className="mb-1 text-xs lowercase text-muted">
        step {step} of {totalSteps}
      </p>
      <div className="mb-6 flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
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
        <section className="flex flex-col gap-5">
          <h1 className="wordmark text-3xl text-white">who are you?</h1>

          {/* avatar (optional) */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="avatar"
                className="h-20 w-20 rounded-full border border-hairline object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-hairline text-muted">
                —
              </div>
            )}
            <div>
              <label className="btn-text cursor-pointer text-sm">
                {uploading ? "uploading…" : avatarUrl ? "change photo" : "add a photo"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f);
                  }}
                />
              </label>
              <p className="text-xs lowercase text-muted">optional, but recommended</p>
            </div>
          </div>

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
            <UsernameHint status={usernameStatus} />
          </div>

          {error && <p className="mono-meta-xs text-signal">{error}</p>}

          <div className="flex gap-2">
            <button className="btn-text flex-1" onClick={() => setStep(1)}>
              back
            </button>
            {fanOnly ? (
              <button
                className="btn-primary flex-1 disabled:opacity-50"
                disabled={busy || !canLeaveIdentity}
                onClick={() => save(false)}
              >
                {busy ? "…" : "finish"}
              </button>
            ) : (
              <button
                className="btn-primary flex-1 disabled:opacity-50"
                disabled={!canLeaveIdentity}
                onClick={() => setStep(3)}
              >
                next
              </button>
            )}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-5">
          <h1 className="wordmark text-3xl text-white">round you out</h1>
          <p className="text-sm lowercase text-muted">all optional — you can edit anytime.</p>

          <div>
            <label className="label" htmlFor="bio">
              bio <span className="text-xs">({bio.length}/500)</span>
            </label>
            <textarea
              id="bio"
              className="input min-h-24"
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="a line or two about you and your work"
            />
          </div>

          <div>
            <span className="label">genres</span>
            <ChipPicker
              options={GENRES.map((g) => ({ value: g, label: g }))}
              selected={genres}
              onToggle={(v) => toggle(genres, setGenres, v)}
            />
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={openToWork}
            onClick={() => setOpenToWork(!openToWork)}
            className="flex min-h-[56px] w-full items-center justify-between border-y border-hairline py-3 text-left"
          >
            <span>
              <span className="mono-meta flex items-center gap-2 text-white">
                {openToWork && <span className="signal-dot" aria-hidden />}
                OPEN TO WORK
              </span>
              <span className="mt-1 block text-sm lowercase text-muted">
                shows a dot on your profile so people know you&apos;re taking gigs
              </span>
            </span>
            <span
              className={`mono-meta px-4 py-2 transition-colors duration-150 ${
                openToWork ? "bg-white text-black" : "text-muted"
              }`}
            >
              {openToWork ? "ON" : "OFF"}
            </span>
          </button>

          <div>
            <span className="label">links</span>
            <p className="mb-2 text-sm lowercase text-muted">
              where your work lives — all optional.
            </p>
            <div className="flex flex-col gap-2">
              {LINK_KEYS.map((key) => (
                <input
                  key={key}
                  className="input"
                  type="url"
                  inputMode="url"
                  placeholder={`https://${key === "website" ? "yoursite.com" : `${key}.com/you`}`}
                  value={links[key] ?? ""}
                  onChange={(e) => setLinks({ ...links, [key]: e.target.value })}
                />
              ))}
            </div>
          </div>

          {error && <p className="mono-meta-xs text-signal">{error}</p>}

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

function UsernameHint({ status }: { status: UsernameStatus }) {
  if (status === "idle" || status === "error") return null;
  const map: Record<Exclude<UsernameStatus, "idle" | "error">, { text: string; cls: string }> = {
    invalid: { text: "3–30 chars: lowercase letters, numbers, _ or .", cls: "text-muted" },
    checking: { text: "checking…", cls: "text-muted" },
    available: { text: "available ✓", cls: "text-white" },
    taken: { text: "taken — try another", cls: "text-signal" },
  };
  const { text, cls } = map[status];
  return <p className={`mono-meta-xs mt-1.5 ${cls}`}>{text}</p>;
}
