import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShowRow from "@/components/ShowRow";
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

  // group by date — ledger sections
  const grouped = new Map<string, ShowWithVenue[]>();
  for (const show of shows) {
    const key = formatShowDate(show.starts_at);
    grouped.set(key, [...(grouped.get(key) ?? []), show]);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-10 sm:pt-14">
        <h1 className="title-giant -ml-1 text-white">shows</h1>
        <Link href="/shows/submit" className="btn-primary mb-2">
          + submit a show
        </Link>
      </div>

      <div className="mt-10">
        <ShowFilters />
      </div>

      {shows.length === 0 ? (
        <div className="mt-16 border-y border-hairline py-12">
          <p className="mono-meta text-muted">NO SHOWS MATCH</p>
          <Link href="/shows/submit" className="btn-text mt-2">
            know one? submit it
          </Link>
        </div>
      ) : (
        <div className="mt-16 flex flex-col gap-16 sm:gap-24">
          {Array.from(grouped.entries()).map(([date, dayShows]) => (
            <section key={date}>
              <h2 className="mono-meta mb-4 text-white">{date}</h2>
              <div className="border-b border-hairline">
                {dayShows.map((show) => (
                  <ShowRow key={show.id} show={show} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
