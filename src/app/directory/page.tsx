import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DirectoryFilters from "./DirectoryFilters";
import { ROLE_LABELS } from "@/lib/constants";
import type { Profile, UserRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "abq music directory — artists, producers, engineers, venues",
  description:
    "Find Albuquerque artists, producers, engineers, videographers, designers, and venues. The local scene, searchable.",
};

type SearchParams = { role?: string; genre?: string; q?: string };

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, roles, genres, open_to_work, bio")
    .order("created_at", { ascending: false })
    .limit(100);

  if (searchParams.role) query = query.contains("roles", [searchParams.role]);
  if (searchParams.genre) query = query.contains("genres", [searchParams.genre]);
  if (searchParams.q) {
    const q = searchParams.q.replace(/[%_]/g, "");
    query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
  }

  const { data } = await query;
  // hide pure fans from the directory — it's a who-to-work-with list
  const profiles = ((data ?? []) as Profile[]).filter(
    (p) => !(p.roles.length === 1 && p.roles[0] === "fan")
  );

  return (
    <div>
      <h1 className="title-giant -ml-1 pt-10 text-white sm:pt-14">directory</h1>

      <div className="mt-10">
        <DirectoryFilters />
      </div>

      {profiles.length === 0 ? (
        <div className="mt-16 border-y border-hairline py-12">
          <p className="mono-meta text-muted">NO ONE MATCHES</p>
          <Link href="/signup" className="btn-text mt-2">
            be the first
          </Link>
        </div>
      ) : (
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
          {profiles.map((p) => (
            <Link key={p.id} href={`/${p.username}`} className="group min-w-0">
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt={p.display_name}
                  className="aspect-square w-full object-cover grayscale transition-[filter] duration-150 group-hover:grayscale-0"
                  loading="lazy"
                />
              ) : (
                <div className="wordmark flex aspect-square w-full items-center justify-center bg-ink text-4xl text-hairline">
                  {p.display_name.slice(0, 1)}
                </div>
              )}
              <p className="mt-3 truncate font-bold text-white">{p.display_name}</p>
              <p className="mono-meta-xs mt-1 truncate text-muted">
                {p.roles.map((r) => ROLE_LABELS[r as UserRole]).join(" / ")}
              </p>
              {p.open_to_work && (
                <p className="mono-meta-xs mt-1 flex items-center gap-1.5 text-white">
                  <span className="signal-dot" aria-hidden />
                  open to work
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
