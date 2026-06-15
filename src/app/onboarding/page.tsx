import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingWizard from "./OnboardingWizard";
import InviteGate from "@/components/InviteGate";

export const metadata: Metadata = { title: "welcome" };

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) redirect(`/${profile.username}`);

  // private beta: must redeem an invite before a profile can be created
  const { data: redemption } = await supabase
    .from("invite_redemptions")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!redemption) return <InviteGate />;

  return <OnboardingWizard userId={user.id} email={user.email ?? ""} />;
}
