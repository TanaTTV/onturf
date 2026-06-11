import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/constants";
import { formatShowDate, formatShowTime, venueLabel } from "@/lib/utils";
import type { LineupEntry, ShowWithVenue } from "@/lib/types";

type Props = { params: { id: string } };

async function getShow(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const supabase = createClient();
  const { data } = await supabase
    .from("shows")
    .select("*, venues(name, address, all_ages)")
    .eq("id", id)
    .maybeSingle();
  return data as ShowWithVenue | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await getShow(params.id);
  if (!show) return { title: "not found" };
  const when = `${formatShowDate(show.starts_at)} · ${formatShowTime(show.starts_at)}`;
  return {
    title: `${show.title} — ${when}`,
    description: `${when} at ${venueLabel(show)}, albuquerque. ${show.price_text ?? ""}`,
    openGraph: {
      title: show.title,
      description: `${when} · ${venueLabel(show)} · abq`,
      images: show.flyer_url ? [show.flyer_url] : undefined,
    },
  };
}

export default async function ShowDetailPage({ params }: Props) {
  const show = await getShow(params.id);
  if (!show) notFound();

  const supabase = createClient();
  const { data: lineup } = await supabase
    .from("show_lineup")
    .select("billing_order, profiles(id, username, display_name, avatar_url, roles)")
    .eq("show_id", show.id)
    .order("billing_order");

  const isPast = new Date(show.starts_at) < new Date();

  return (
    <article className="mx-auto flex w-full max-w-xl flex-col gap-5 pt-2">
      {show.status !== "approved" && (
        <p className="border border-accent p-3 text-sm lowercase text-accent">
          this show is {show.status} — only you (and admins) can see it.
        </p>
      )}

      {show.flyer_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={show.flyer_url}
          alt={`${show.title} flyer`}
          className="w-full border border-border object-contain"
        />
      )}

      <header>
        <p className="text-sm lowercase text-accent">
          {formatShowDate(show.starts_at)} · {formatShowTime(show.starts_at)}
          {isPast && <span className="ml-2 text-muted">(past)</span>}
        </p>
        <h1 className="wordmark mt-1 text-3xl text-white">{show.title}</h1>
        <p className="mt-1 lowercase text-muted">
          {venueLabel(show)}
          {show.venues?.address && ` · ${show.venues.address}`}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm lowercase">
          {show.price_text && <span className="text-white">{show.price_text}</span>}
          {show.all_ages && <span className="chip border-white text-white">all ages</span>}
          {show.genres.map((g) => (
            <span key={g} className="chip">
              {g}
            </span>
          ))}
        </p>
      </header>

      {show.ticket_url && (
        <a
          href={show.ticket_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent"
        >
          tickets ↗
        </a>
      )}

      {show.description && (
        <p className="whitespace-pre-line text-sm text-white">{show.description}</p>
      )}

      {lineup && lineup.length > 0 && (
        <section>
          <h2 className="wordmark mb-2 text-xl text-white">lineup</h2>
          <div className="flex flex-col gap-2">
            {(lineup as unknown as LineupEntry[]).map((entry) =>
              entry.profiles ? (
                <Link
                  key={entry.profiles.id}
                  href={`/${entry.profiles.username}`}
                  className="flex items-center gap-3 border border-border bg-surface p-2 hover:border-accent"
                >
                  {entry.profiles.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.profiles.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted">
                      {entry.profiles.display_name.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-white">{entry.profiles.display_name}</span>
                  <span className="text-xs lowercase text-muted">
                    {entry.profiles.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
                  </span>
                </Link>
              ) : null
            )}
          </div>
        </section>
      )}

      <Link href="/shows" className="text-sm lowercase text-muted underline">
        ← all shows
      </Link>
    </article>
  );
}
