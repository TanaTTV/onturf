"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import ChipPicker from "@/components/ChipPicker";
import ProfileSearch, { type ProfileHit } from "@/components/ProfileSearch";
import { GENRES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { localInputToISO, resizeImage } from "@/lib/utils";
import { showSchema, type ShowFormValues } from "@/lib/validation";
import type { Venue } from "@/lib/types";

export default function SubmitShowForm({
  userId,
  venues,
}: {
  userId: string;
  venues: Venue[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ShowFormValues>({
    resolver: zodResolver(showSchema),
    defaultValues: { genres: [], all_ages: false },
  });

  const [flyer, setFlyer] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [lineup, setLineup] = useState<ProfileHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const genres = watch("genres");
  const venueId = watch("venue_id");

  function onFlyerChange(file: File | null) {
    setFlyer(file);
    if (flyerPreview) URL.revokeObjectURL(flyerPreview);
    setFlyerPreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(values: ShowFormValues) {
    setError(null);
    if (!values.venue_id && !values.venue_name_freetext?.trim()) {
      return setError("pick a venue or type one in");
    }

    setBusy(true);
    const supabase = createClient();
    try {
      let flyerUrl: string | null = null;
      if (flyer) {
        const blob = await resizeImage(flyer, 1600);
        if (blob.size > MAX_UPLOAD_BYTES) throw new Error("flyer too large after resize");
        const path = `${userId}/flyer-${Date.now()}.webp`;
        const { error: upErr } = await supabase.storage
          .from("flyers")
          .upload(path, blob, { contentType: "image/webp" });
        if (upErr) throw upErr;
        flyerUrl = supabase.storage.from("flyers").getPublicUrl(path).data.publicUrl;
      }

      const { data: show, error: insErr } = await supabase
        .from("shows")
        .insert({
          title: values.title,
          flyer_url: flyerUrl,
          venue_id: values.venue_id || null,
          venue_name_freetext: values.venue_id ? null : values.venue_name_freetext?.trim() || null,
          starts_at: localInputToISO(values.starts_at),
          price_text: values.price_text?.trim() || null,
          all_ages: values.all_ages,
          genres: values.genres,
          ticket_url: values.ticket_url || null,
          description: values.description?.trim() || null,
          submitted_by: userId,
          status: "pending",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;

      if (lineup.length > 0) {
        const { error: lineupErr } = await supabase.from("show_lineup").insert(
          lineup.map((p, i) => ({
            show_id: show.id,
            profile_id: p.id,
            billing_order: i,
          }))
        );
        if (lineupErr) throw lineupErr;
      }

      router.push(`/shows/${show.id}`);
      router.refresh();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message.toLowerCase() : "something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="label" htmlFor="title">
          show title
        </label>
        <input id="title" className="input" maxLength={120} {...register("title")} />
        {errors.title && (
          <p className="mt-1 mono-meta-xs text-muted">{errors.title.message}</p>
        )}
      </div>

      <div>
        <span className="label">flyer (jpg/png/webp)</span>
        <label className="btn-text block cursor-pointer text-sm">
          {flyer ? flyer.name : "upload flyer"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => onFlyerChange(e.target.files?.[0] ?? null)}
          />
        </label>
        {flyerPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flyerPreview} alt="flyer preview" className="mt-2 max-h-64 border border-hairline" />
        )}
      </div>

      <div>
        <label className="label" htmlFor="venue">
          venue
        </label>
        <select id="venue" className="input" {...register("venue_id")}>
          <option value="">— pick a venue —</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        {!venueId && (
          <input
            className="input mt-2"
            placeholder="…or type the venue / spot name"
            maxLength={120}
            {...register("venue_name_freetext")}
          />
        )}
      </div>

      <div>
        <label className="label" htmlFor="starts_at">
          date & time
        </label>
        <input id="starts_at" type="datetime-local" className="input" {...register("starts_at")} />
        {errors.starts_at && (
          <p className="mt-1 mono-meta-xs text-muted">{errors.starts_at.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label" htmlFor="price_text">
            price
          </label>
          <input
            id="price_text"
            className="input"
            placeholder='"$10", "free", "$10 adv / $15 door"'
            maxLength={60}
            {...register("price_text")}
          />
        </div>
        <label className="flex items-end gap-2 pb-2.5 lowercase text-white">
          <input type="checkbox" className="h-4 w-4 accent-[var(--white)]" {...register("all_ages")} />
          all ages
        </label>
      </div>

      <div>
        <span className="label">genres</span>
        <ChipPicker
          options={GENRES.map((g) => ({ value: g, label: g }))}
          selected={genres}
          onToggle={(v) =>
            setValue(
              "genres",
              genres.includes(v as (typeof GENRES)[number])
                ? genres.filter((g) => g !== v)
                : [...genres, v as (typeof GENRES)[number]]
            )
          }
        />
      </div>

      <div>
        <label className="label" htmlFor="ticket_url">
          ticket link (optional)
        </label>
        <input id="ticket_url" type="url" inputMode="url" className="input" {...register("ticket_url")} />
        {errors.ticket_url && (
          <p className="mt-1 mono-meta-xs text-muted">{errors.ticket_url.message}</p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="description">
          description (optional)
        </label>
        <textarea id="description" className="input min-h-24" maxLength={1000} {...register("description")} />
      </div>

      <div>
        <span className="label">lineup — tag artists on the bill</span>
        <div className="mb-2 flex flex-col gap-1">
          {lineup.map((p, i) => (
            <div key={p.id} className="flex min-h-[44px] items-center gap-2 border-t border-hairline py-2 text-sm">
              <span className="text-muted">{i + 1}.</span>
              <span className="flex-1 text-white">
                {p.display_name} <span className="text-muted">@{p.username}</span>
              </span>
              <button
                type="button"
                onClick={() => setLineup(lineup.filter((x) => x.id !== p.id))}
                className="lowercase text-muted hover:text-white"
              >
                remove
              </button>
            </div>
          ))}
        </div>
        <ProfileSearch
          placeholder="search artists by name…"
          onSelect={(p) => {
            if (!lineup.some((x) => x.id === p.id)) setLineup([...lineup, p]);
          }}
        />
      </div>

      {error && <p className="mono-meta-xs text-muted">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
        {busy ? "submitting…" : "submit for review"}
      </button>
    </form>
  );
}
