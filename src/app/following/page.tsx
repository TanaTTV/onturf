import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShowRow from "@/components/ShowRow";
import type { ShowWithVenue } from "@/lib/types";

export const metadata: Metadata = { title: "following" };

export default async function FollowingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/following");

  const { data: follows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const ids = (follows ?? []).map((f) => f.following_id);

  let upcoming: ShowWithVenue[] = [];
  if (ids.length > 0) {
    const { data: lineup } = await supabase
      .from("show_lineup")
      .select("show_id, shows!inner(*, venues(name, address, all_ages))")
      .in("profile_id", ids)
      .eq("shows.status", "approved")
      .gte("shows.starts_at", new Date().toISOString());

    // one show can have several followed artists on the bill — dedupe by id
    const byId = new Map<string, ShowWithVenue>();
    for (const row of (lineup ?? []) as unknown as { shows: ShowWithVenue }[]) {
      if (row.shows) byId.set(row.shows.id, row.shows);
    }
    upcoming = Array.from(byId.values()).sort((a, b) =>
      a.starts_at.localeCompare(b.starts_at)
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="wordmark pt-10 text-5xl text-white sm:text-6xl">following</h1>
      <p className="mono-meta mt-4 text-muted">SHOWS FROM ARTISTS YOU FOLLOW</p>

      {upcoming.length > 0 ? (
        <div className="mt-10 border-b border-hairline">
          {upcoming.map((show) => (
            <ShowRow key={show.id} show={show} />
          ))}
        </div>
      ) : (
        <div className="mt-10 border-y border-hairline py-12">
          <p className="mono-meta text-muted">
            {ids.length === 0
              ? "YOU'RE NOT FOLLOWING ANYONE YET"
              : "NO UPCOMING SHOWS FROM YOUR FOLLOWS"}
          </p>
          <Link href="/directory" className="btn-text mt-2">
            find artists to follow
          </Link>
        </div>
      )}
    </div>
  );
}
