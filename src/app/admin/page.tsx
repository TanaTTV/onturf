import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PendingShowCard from "./PendingShowCard";
import ProfileModeration from "./ProfileModeration";
import type { ShowWithVenue } from "@/lib/types";

export const metadata: Metadata = { title: "admin" };

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.is_admin) redirect("/");

  const { data: pending } = await supabase
    .from("shows")
    .select("*, venues(name, address, all_ages)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8">
      <h1 className="wordmark pt-2 text-3xl text-white">admin</h1>

      <section>
        <h2 className="wordmark mb-3 text-xl text-white">
          pending shows{" "}
          <span className="text-accent">({pending?.length ?? 0})</span>
        </h2>
        {pending && pending.length > 0 ? (
          <div className="flex flex-col gap-3">
            {(pending as ShowWithVenue[]).map((show) => (
              <PendingShowCard key={show.id} show={show} />
            ))}
          </div>
        ) : (
          <p className="border border-border p-6 text-center lowercase text-muted">
            queue is clear. nice.
          </p>
        )}
      </section>

      <ProfileModeration />
    </div>
  );
}
