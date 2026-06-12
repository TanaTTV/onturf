import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShowRow from "@/components/ShowRow";
import GhostWordmark from "@/components/GhostWordmark";
import Marquee from "@/components/Marquee";
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
    <>
      <GhostWordmark />
      <div className="relative z-10">
        {/* hero — pinned left, allowed to clip, dead space on the right */}
        <section className="pt-16 sm:pt-24">
          <h1 className="title-giant -ml-1 text-[22vw] text-white sm:-ml-2">
            ONTURF
          </h1>
          <p className="mono-meta mt-6 text-muted">
            ABQ — LOCAL SHOWS — ARTISTS — PRODUCERS — VENUES
          </p>
          <div className="mt-10 flex items-center gap-8">
            <Link href="/shows" className="btn-primary">
              browse shows
            </Link>
            <Link href="/signup" className="btn-text">
              join the directory
            </Link>
          </div>
        </section>

        <div className="mt-24 sm:mt-36">
          <Marquee text="ABQ — FIND SHOWS — GET FOUND — CONNECT" />
        </div>

        {/* next up — ledger */}
        <section className="mt-24 sm:mt-36">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="wordmark text-3xl text-white sm:text-4xl">next up</h2>
            <Link href="/shows" className="btn-text py-0">
              all shows
            </Link>
          </div>
          {shows && shows.length > 0 ? (
            <div className="border-b border-hairline">
              {(shows as ShowWithVenue[]).map((show) => (
                <ShowRow key={show.id} show={show} />
              ))}
            </div>
          ) : (
            <div className="border-y border-hairline py-12">
              <p className="mono-meta text-muted">NO UPCOMING SHOWS YET</p>
              <Link href="/shows/submit" className="btn-text mt-2">
                submit the first one
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
