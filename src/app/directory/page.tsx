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
    <div className="flex flex-col gap-4">
      <h1 className="wordmark pt-2 text-3xl text-white">directory</h1>
      <DirectoryFilters />

      {profiles.length === 0 ? (
        <div className="border border-border p-10 text-center lowercase text-muted">
          no one matches.{" "}
          <Link href="/signup" className="text-accent">
            be the first →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/${p.username}`}
              className="flex flex-col items-center gap-2 border border-border bg-surface p-4 text-center transition-colors hover:border-accent"
            >
              {p.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.avatar_url}
                  alt={p.display_name}
                  className="h-16 w-16 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="wordmark flex h-16 w-16 items-center justify-center rounded-full border border-border text-xl text-muted">
                  {p.display_name.slice(0, 1)}
                </span>
              )}
              <span className="w-full truncate font-bold text-white">{p.display_name}</span>
              <span className="text-xs lowercase text-muted">
                {p.roles.map((r) => ROLE_LABELS[r as UserRole]).join(" · ")}
              </span>
              {p.open_to_work && (
                <span className="chip chip-active">open to work</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
