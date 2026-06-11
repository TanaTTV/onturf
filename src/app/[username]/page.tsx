import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShowCard from "@/components/ShowCard";
import EmbedPlayer from "@/components/EmbedPlayer";
import ConfirmCreditButton from "@/components/ConfirmCreditButton";
import { ROLE_LABELS } from "@/lib/constants";
import type {
  Credit,
  Profile,
  ProfileEmbed,
  ShowWithVenue,
} from "@/lib/types";

type Props = { params: { username: string } };

async function getProfile(username: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return data as Profile | null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile(params.username);
  if (!profile) return { title: "not found" };
  const roleText = profile.roles.map((r) => ROLE_LABELS[r]).join(", ");
  return {
    title: `${profile.display_name} — ${roleText}`,
    description:
      profile.bio ??
      `${profile.display_name} on ONTURF — ${roleText} in ${profile.city}.`,
    openGraph: {
      title: `${profile.display_name} · ONTURF`,
      description: profile.bio ?? `${roleText} in ${profile.city}`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

type CreditWithProfile = Credit & {
  credited: Pick<Profile, "username" | "display_name"> | null;
};

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const [{ data: embeds }, { data: credits }, { data: lineup }] = await Promise.all([
    supabase
      .from("profile_embeds")
      .select("*")
      .eq("profile_id", profile.id)
      .order("sort_order"),
    supabase
      .from("credits")
      .select("*, credited:profiles!credits_credited_id_fkey(username, display_name)")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("show_lineup")
      .select("show_id, shows!inner(*, venues(name, address, all_ages))")
      .eq("profile_id", profile.id)
      .eq("shows.status", "approved")
      .gte("shows.starts_at", new Date().toISOString()),
  ]);

  // credits where this profile is the credited party (shown as "credited on")
  const { data: creditedOn } = await supabase
    .from("credits")
    .select("*, owner:profiles!credits_owner_id_fkey(username, display_name)")
    .eq("credited_id", profile.id)
    .order("created_at", { ascending: false });

  const upcomingShows = ((lineup ?? []) as unknown as { shows: ShowWithVenue }[])
    .map((l) => l.shows)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const links = Object.entries(profile.links ?? {}).filter(([, v]) => v);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {/* header */}
      <section className="flex items-start gap-4 pt-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="h-24 w-24 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <div className="wordmark flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-border text-3xl text-muted">
            {profile.display_name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="wordmark text-3xl text-white">{profile.display_name}</h1>
          <p className="text-sm lowercase text-muted">
            @{profile.username} · {profile.city}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {profile.roles.map((r) => (
              <span key={r} className="chip chip-active">
                {ROLE_LABELS[r]}
              </span>
            ))}
            {profile.open_to_work && (
              <span className="chip border-white text-white">open to work</span>
            )}
          </div>
          {profile.genres.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {profile.genres.map((g) => (
                <span key={g} className="chip">
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {profile.bio && <p className="whitespace-pre-line text-sm text-white">{profile.bio}</p>}

      {isOwner && (
        <Link href="/settings" className="btn-ghost w-full sm:w-auto">
          edit profile
        </Link>
      )}

      {/* links out */}
      {links.length > 0 && (
        <section>
          <h2 className="wordmark mb-2 text-xl text-white">links</h2>
          <div className="flex flex-wrap gap-2">
            {links.map(([key, url]) => (
              <a
                key={key}
                href={url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost px-4 py-2 text-sm"
              >
                {key} ↗
              </a>
            ))}
          </div>
        </section>
      )}

      {/* embeds */}
      {embeds && embeds.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="wordmark text-xl text-white">listen / watch</h2>
          {(embeds as ProfileEmbed[]).map((e) => (
            <EmbedPlayer key={e.id} url={e.embed_url} />
          ))}
        </section>
      )}

      {/* upcoming shows */}
      {upcomingShows.length > 0 && (
        <section>
          <h2 className="wordmark mb-2 text-xl text-white">upcoming shows</h2>
          <div className="flex flex-col gap-2">
            {upcomingShows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        </section>
      )}

      {/* worked with */}
      {((credits && credits.length > 0) || (creditedOn && creditedOn.length > 0)) && (
        <section>
          <h2 className="wordmark mb-2 text-xl text-white">worked with</h2>
          <div className="flex flex-col gap-2">
            {((credits ?? []) as unknown as CreditWithProfile[]).map((c) => (
              <div key={c.id} className="border border-border bg-surface p-3 text-sm">
                <p className="text-white">
                  {c.work_url ? (
                    <a href={c.work_url} target="_blank" rel="noopener noreferrer" className="underline">
                      {c.work_title}
                    </a>
                  ) : (
                    c.work_title
                  )}
                </p>
                <p className="lowercase text-muted">
                  {c.role_label}:{" "}
                  {c.credited ? (
                    <Link href={`/${c.credited.username}`} className="text-accent">
                      {c.credited.display_name}
                    </Link>
                  ) : (
                    "unknown"
                  )}{" "}
                  {!c.confirmed && <span className="chip ml-1">unconfirmed</span>}
                </p>
              </div>
            ))}
            {(
              (creditedOn ?? []) as unknown as (Credit & {
                owner: Pick<Profile, "username" | "display_name"> | null;
              })[]
            ).map((c) => (
              <div key={c.id} className="border border-border bg-surface p-3 text-sm">
                <p className="text-white">
                  {c.work_url ? (
                    <a href={c.work_url} target="_blank" rel="noopener noreferrer" className="underline">
                      {c.work_title}
                    </a>
                  ) : (
                    c.work_title
                  )}
                </p>
                <p className="lowercase text-muted">
                  {c.role_label} for{" "}
                  {c.owner ? (
                    <Link href={`/${c.owner.username}`} className="text-accent">
                      {c.owner.display_name}
                    </Link>
                  ) : (
                    "unknown"
                  )}{" "}
                  {!c.confirmed && <span className="chip ml-1">unconfirmed</span>}
                  {!c.confirmed && user?.id === profile.id && (
                    <ConfirmCreditButton creditId={c.id} />
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* empty state for brand-new profiles */}
      {!profile.bio &&
        links.length === 0 &&
        (!embeds || embeds.length === 0) &&
        upcomingShows.length === 0 && (
          <div className="border border-border p-8 text-center lowercase text-muted">
            {isOwner ? (
              <>
                your profile is bare.{" "}
                <Link href="/settings" className="text-accent">
                  add a bio, links, and music →
                </Link>
              </>
            ) : (
              <>nothing here yet.</>
            )}
          </div>
        )}
    </div>
  );
}
