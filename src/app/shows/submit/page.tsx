import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitShowForm from "./SubmitShowForm";
import type { Venue } from "@/lib/types";

export const metadata: Metadata = { title: "submit a show" };

export default async function SubmitShowPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/shows/submit");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  const { data: venues } = await supabase
    .from("venues")
    .select("*")
    .order("name");

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="wordmark pt-10 text-5xl text-white sm:text-6xl">submit a show</h1>
      <p className="mb-10 mt-3 text-sm lowercase text-muted">
        shows go live after a quick review — usually same day.
      </p>
      <SubmitShowForm userId={user.id} venues={(venues ?? []) as Venue[]} />
    </div>
  );
}
