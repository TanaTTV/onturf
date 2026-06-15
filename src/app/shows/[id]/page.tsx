import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareCardButton from "@/components/ShareCardButton";
import { ROLE_LABELS, SITE_URL } from "@/lib/constants";
import { formatShowDate, formatShowTime, safeExternalUrl, venueLabel } from "@/lib/utils";
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
  const denverDay = (d: Date) =>
    d.toLocaleDateString("en-US", { timeZone: "America/Denver" });
  const isTonight = denverDay(new Date(show.starts_at)) === denverDay(new Date());

  const lineupNames = ((lineup ?? []) as unknown as LineupEntry[])
    .map((e) => e.profiles?.display_name)
    .filter((n): n is string => Boolean(n));

  return (
    <article className="mx-auto grid w-full max-w-5xl gap-x-12 gap-y-10 pt-10 sm:grid-cols-[1fr_320px] sm:pt-14">
      <div className="min-w-0">
        {show.status !== "approved" && (
          <p className="mono-meta mb-6 flex items-center gap-2 text-muted">
            <span className="signal-dot" aria-hidden />
            {show.status} — only you and admins can see this
          </p>
        )}

        <p className="mono-meta text-muted">
          {formatShowDate(show.starts_at)} — {formatShowTime(show.starts_at)}
          {isPast && " — past"}
        </p>
        <h1 className="wordmark mt-3 text-[clamp(2.5rem,9vw,5.5rem)] text-white">
          {show.title}
        </h1>
        <p className="mono-meta mt-5 text-muted">
          {venueLabel(show)}
          {show.venues?.address && ` — ${show.venues.address}`}
        </p>
        <p className="mono-meta mt-1.5 text-muted">
          {[
            show.price_text,
            show.all_ages ? "all ages" : null,
            ...show.genres,
          ]
            .filter(Boolean)
            .join(" / ")}
        </p>

        <div className="mt-4">
          <ShareCardButton
            kind="show"
            filename={`onturf-show-${show.id.slice(0, 8)}`}
            data={{
              title: show.title,
              dateLine: `${formatShowDate(show.starts_at)} — ${formatShowTime(show.starts_at)}`,
              venueLine: [
                venueLabel(show),
                show.price_text,
                show.all_ages ? "all ages" : null,
              ]
                .filter(Boolean)
                .join(" — "),
              isTonight,
              city: show.city,
              flyerUrl: show.flyer_url,
              lineup: lineupNames,
              showUrl: `${SITE_URL}/shows/${show.id}`,
              siteHost: new URL(SITE_URL).host,
            }}
          />
        </div>

        {safeExternalUrl(show.ticket_url) && (
          <a
            href={safeExternalUrl(show.ticket_url)!}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-8"
          >
            tickets
          </a>
        )}

        {show.description && (
          <p className="mt-8 max-w-prose whitespace-pre-line text-sm text-white">
            {show.description}
          </p>
        )}

        {lineup && lineup.length > 0 && (
          <section className="mt-16">
            <h2 className="mono-meta mb-4 text-white">LINEUP</h2>
            <div className="border-b border-hairline">
              {(lineup as unknown as LineupEntry[]).map((entry) =>
                entry.profiles ? (
                  <Link
                    key={entry.profiles.id}
                    href={`/${entry.profiles.username}`}
                    className="row-hover flex min-h-[56px] items-center gap-4 border-t border-hairline py-3"
                  >
                    {entry.profiles.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.profiles.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover grayscale"
                      />
                    ) : (
                      <span className="mono-meta-xs flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-muted">
                        {entry.profiles.display_name.slice(0, 1)}
                      </span>
                    )}
                    <span className="font-bold text-white">
                      {entry.profiles.display_name}
                    </span>
                    <span className="mono-meta-xs text-muted">
                      {entry.profiles.roles.map((r) => ROLE_LABELS[r]).join(" / ")}
                    </span>
                  </Link>
                ) : null
              )}
            </div>
          </section>
        )}

        <Link href="/shows" className="btn-text mt-12 text-muted">
          ← all shows
        </Link>
      </div>

      {show.flyer_url && (
        <div className="sm:order-last">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={show.flyer_url}
            alt={`${show.title} flyer`}
            className="w-full object-contain"
          />
        </div>
      )}
    </article>
  );
}
