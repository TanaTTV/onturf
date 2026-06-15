import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShowRow from "@/components/ShowRow";
import GhostWordmark from "@/components/GhostWordmark";
import EmbedPlayer from "@/components/EmbedPlayer";
import ConfirmCreditButton from "@/components/ConfirmCreditButton";
import ShareCardButton from "@/components/ShareCardButton";
import { ROLE_LABELS, SITE_URL, resolveLinkPage } from "@/lib/constants";
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
  const linkPage = resolveLinkPage(profile.link_page);
  const showLinkPage = linkPage.enabled || isOwner;

  return (
    <>
      <GhostWordmark />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-20 sm:gap-28">
        {/* header */}
        <section className="pt-10 sm:pt-14">
          <div className="flex items-end gap-5">
            {profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="h-20 w-20 shrink-0 rounded-full object-cover grayscale sm:h-24 sm:w-24"
              />
            )}
            <div className="min-w-0">
              <p className="mono-meta-xs text-muted">
                @{profile.username} — {profile.city}
              </p>
            </div>
          </div>
          <h1 className="wordmark mt-4 break-words text-[clamp(2.5rem,11vw,5rem)] text-white">
            {profile.display_name}
          </h1>
          <p className="mono-meta mt-4 flex flex-wrap items-center gap-x-2 text-muted">
            {profile.roles.map((r) => ROLE_LABELS[r]).join(" / ")}
            {profile.open_to_work && (
              <span className="flex items-center gap-1.5 text-white">
                <span className="signal-dot" aria-hidden />
                open to work
              </span>
            )}
          </p>
          {profile.genres.length > 0 && (
            <p className="mono-meta-xs mt-1.5 text-muted">{profile.genres.join(" / ")}</p>
          )}

          {profile.bio && (
            <p className="mt-8 max-w-prose whitespace-pre-line text-sm text-white">
              {profile.bio}
            </p>
          )}

          <div className="mt-6 flex items-center gap-6">
            {isOwner && (
              <Link href="/settings" className="btn-text py-1 text-muted">
                edit profile
              </Link>
            )}
            {showLinkPage && (
              <Link href={`/l/${profile.username}`} className="btn-text py-1 text-muted">
                link page{!linkPage.enabled && isOwner ? " (draft)" : ""} ↗
              </Link>
            )}
            <ShareCardButton
              kind="profile"
              filename={`onturf-${profile.username}`}
              data={{
                displayName: profile.display_name,
                username: profile.username,
                city: profile.city,
                roles: profile.roles.map((r) => ROLE_LABELS[r]),
                genres: profile.genres,
                avatarUrl: profile.avatar_url,
                foundingMember: profile.founding_member ?? false,
                profileUrl: `${SITE_URL}/${profile.username}`,
                siteHost: new URL(SITE_URL).host,
              }}
            />
          </div>
        </section>

        {/* links out */}
        {links.length > 0 && (
          <section>
            <h2 className="mono-meta mb-4 text-white">LINKS</h2>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {links.map(([key, url]) => (
                <a
                  key={key}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-text py-1"
                >
                  {key} ↗
                </a>
              ))}
            </div>
          </section>
        )}

        {/* embeds — single quiet column */}
        {embeds && embeds.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="mono-meta text-white">LISTEN / WATCH</h2>
            {(embeds as ProfileEmbed[]).map((e) => (
              <EmbedPlayer key={e.id} url={e.embed_url} />
            ))}
          </section>
        )}

        {/* upcoming shows */}
        {upcomingShows.length > 0 && (
          <section>
            <h2 className="mono-meta mb-4 text-white">UPCOMING SHOWS</h2>
            <div className="border-b border-hairline">
              {upcomingShows.map((show) => (
                <ShowRow key={show.id} show={show} />
              ))}
            </div>
          </section>
        )}

        {/* worked with */}
        {((credits && credits.length > 0) || (creditedOn && creditedOn.length > 0)) && (
          <section>
            <h2 className="mono-meta mb-4 text-white">WORKED WITH</h2>
            <div className="border-b border-hairline">
              {((credits ?? []) as unknown as CreditWithProfile[]).map((c) => (
                <div key={c.id} className="border-t border-hairline py-3 text-sm">
                  <p className="font-bold text-white">
                    {c.work_url ? (
                      <a href={c.work_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                        {c.work_title}
                      </a>
                    ) : (
                      c.work_title
                    )}
                  </p>
                  <p className="mono-meta-xs mt-1 text-muted">
                    {c.role_label} —{" "}
                    {c.credited ? (
                      <Link href={`/${c.credited.username}`} className="text-white underline-offset-4 hover:underline">
                        {c.credited.display_name}
                      </Link>
                    ) : (
                      "unknown"
                    )}
                    {!c.confirmed && " — unconfirmed"}
                  </p>
                </div>
              ))}
              {(
                (creditedOn ?? []) as unknown as (Credit & {
                  owner: Pick<Profile, "username" | "display_name"> | null;
                })[]
              ).map((c) => (
                <div key={c.id} className="border-t border-hairline py-3 text-sm">
                  <p className="font-bold text-white">
                    {c.work_url ? (
                      <a href={c.work_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                        {c.work_title}
                      </a>
                    ) : (
                      c.work_title
                    )}
                  </p>
                  <p className="mono-meta-xs mt-1 text-muted">
                    {c.role_label} for{" "}
                    {c.owner ? (
                      <Link href={`/${c.owner.username}`} className="text-white underline-offset-4 hover:underline">
                        {c.owner.display_name}
                      </Link>
                    ) : (
                      "unknown"
                    )}
                    {!c.confirmed && " — unconfirmed"}
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
            <div className="border-y border-hairline py-12">
              <p className="mono-meta text-muted">
                {isOwner ? "YOUR PROFILE IS BARE" : "NOTHING HERE YET"}
              </p>
              {isOwner && (
                <Link href="/settings" className="btn-text mt-2">
                  add a bio, links, and music
                </Link>
              )}
            </div>
          )}
      </div>
    </>
  );
}
