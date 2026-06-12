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
      <h1 className="wordmark pt-10 text-5xl text-white sm:text-6xl">admin</h1>

      <section>
        <h2 className="mono-meta mb-4 text-white">
          PENDING SHOWS ({pending?.length ?? 0})
        </h2>
        {pending && pending.length > 0 ? (
          <div className="flex flex-col gap-3">
            {(pending as ShowWithVenue[]).map((show) => (
              <PendingShowCard key={show.id} show={show} />
            ))}
          </div>
        ) : (
          <p className="mono-meta border-y border-hairline py-10 text-muted">
            QUEUE IS CLEAR
          </p>
        )}
      </section>

      <ProfileModeration />
    </div>
  );
}
