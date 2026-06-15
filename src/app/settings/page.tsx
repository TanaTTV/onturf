import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";
import EmbedsManager from "./EmbedsManager";
import CreditsManager from "./CreditsManager";
import LinkPageManager from "./LinkPageManager";
import AccountSection from "./AccountSection";
import type { Credit, Profile, ProfileEmbed } from "@/lib/types";

export const metadata: Metadata = { title: "settings" };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  const [{ data: embeds }, { data: credits }] = await Promise.all([
    supabase
      .from("profile_embeds")
      .select("*")
      .eq("profile_id", user.id)
      .order("sort_order"),
    supabase
      .from("credits")
      .select("*, credited:profiles!credits_credited_id_fkey(username, display_name)")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
      <h1 className="wordmark pt-10 text-5xl text-white sm:text-6xl">settings</h1>
      <SettingsForm profile={profile as Profile} />
      <EmbedsManager embeds={(embeds ?? []) as ProfileEmbed[]} userId={user.id} />
      <LinkPageManager profile={profile as Profile} />
      <CreditsManager
        credits={(credits ?? []) as (Credit & { credited: { username: string; display_name: string } | null })[]}
        userId={user.id}
      />
      <AccountSection email={user.email ?? ""} />
    </div>
  );
}
