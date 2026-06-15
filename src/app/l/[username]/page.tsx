import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LinkPage from "@/components/LinkPage";
import { resolveLinkPage, SITE_URL } from "@/lib/constants";
import type { Profile } from "@/lib/types";

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
  return {
    title: `${profile.display_name} — links`,
    description: `${profile.display_name}'s links.`,
    alternates: { canonical: `${SITE_URL}/l/${profile.username}` },
    openGraph: {
      title: profile.display_name,
      description: `${profile.display_name}'s links`,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function LinkPageRoute({ params }: Props) {
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  const config = resolveLinkPage(profile.link_page);

  // public unless enabled; the owner can still view their own to check it
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;
  if (!config.enabled && !isOwner) notFound();

  return <LinkPage profile={profile} config={config} />;
}
