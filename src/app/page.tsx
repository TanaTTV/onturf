import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShowCard from "@/components/ShowCard";
import { TAGLINE } from "@/lib/constants";
import type { ShowWithVenue } from "@/lib/types";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: shows } = await supabase
    .from("shows")
    .select("*, venues(name, address, all_ages)")
    .eq("status", "approved")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(5);

  return (
    <div className="flex flex-col gap-10">
      <section className="pt-10 text-center">
        <h1 className="wordmark text-6xl text-white sm:text-8xl">ONTURF</h1>
        <p className="mt-3 lowercase text-muted">{TAGLINE}</p>
        <p className="mx-auto mt-2 max-w-md text-sm lowercase text-muted">
          the albuquerque music scene in one place — shows, artists, producers,
          engineers, venues.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/shows" className="btn-accent">
            browse shows
          </Link>
          <Link href="/signup" className="btn-ghost">
            join the directory
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="wordmark text-2xl text-white">next up</h2>
          <Link href="/shows" className="text-sm lowercase text-accent">
            all shows →
          </Link>
        </div>
        {shows && shows.length > 0 ? (
          <div className="flex flex-col gap-2">
            {(shows as ShowWithVenue[]).map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        ) : (
          <div className="border border-border p-8 text-center lowercase text-muted">
            no upcoming shows yet.{" "}
            <Link href="/shows/submit" className="text-accent">
              submit the first one →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
