import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShowCard from "@/components/ShowCard";
import ShowFilters from "./ShowFilters";
import { formatShowDate } from "@/lib/utils";
import type { ShowWithVenue } from "@/lib/types";

export const metadata: Metadata = {
  title: "abq shows — local music calendar",
  description:
    "Every local show in Albuquerque: hip-hop, punk, DIY, electronic, and more. Community-submitted, updated daily.",
};

type SearchParams = {
  genre?: string;
  all_ages?: string;
  from?: string;
  to?: string;
};

export default async function ShowsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let query = supabase
    .from("shows")
    .select("*, venues(name, address, all_ages)")
    .eq("status", "approved")
    .order("starts_at", { ascending: true })
    .limit(100);

  const fromIso = searchParams.from
    ? new Date(`${searchParams.from}T00:00:00-06:00`).toISOString()
    : new Date().toISOString();
  query = query.gte("starts_at", fromIso);
  if (searchParams.to) {
    query = query.lte(
      "starts_at",
      new Date(`${searchParams.to}T23:59:59-06:00`).toISOString()
    );
  }
  if (searchParams.genre) query = query.contains("genres", [searchParams.genre]);
  if (searchParams.all_ages === "1") query = query.eq("all_ages", true);

  const { data } = await query;
  const shows = (data ?? []) as ShowWithVenue[];

  // group by date for the calendar feel
  const grouped = new Map<string, ShowWithVenue[]>();
  for (const show of shows) {
    const key = formatShowDate(show.starts_at);
    grouped.set(key, [...(grouped.get(key) ?? []), show]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between pt-2">
        <h1 className="wordmark text-3xl text-white">shows</h1>
        <Link href="/shows/submit" className="btn-accent px-4 py-2 text-sm">
          + submit a show
        </Link>
      </div>

      <ShowFilters />

      {shows.length === 0 ? (
        <div className="border border-border p-10 text-center lowercase text-muted">
          no shows match.{" "}
          <Link href="/shows/submit" className="text-accent">
            know one? submit it →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Array.from(grouped.entries()).map(([date, dayShows]) => (
            <section key={date}>
              <h2 className="wordmark mb-2 border-b border-border pb-1 text-lg text-accent">
                {date.toLowerCase()}
              </h2>
              <div className="flex flex-col gap-2">
                {dayShows.map((show) => (
                  <ShowCard key={show.id} show={show} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
