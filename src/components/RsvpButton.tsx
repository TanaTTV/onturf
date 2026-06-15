"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RsvpButton({
  showId,
  userId,
  initialGoing,
  initialCount,
}: {
  showId: string;
  userId: string | null;
  initialGoing: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [going, setGoing] = useState(initialGoing);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  if (!userId) {
    return (
      <Link href={`/login?next=/shows/${showId}`} className="btn-text text-muted">
        {count} going — log in to rsvp
      </Link>
    );
  }

  async function toggle() {
    if (!userId || busy) return;
    setBusy(true);
    const supabase = createClient();
    if (going) {
      await supabase.from("show_rsvps").delete().eq("show_id", showId).eq("profile_id", userId);
      setGoing(false);
      setCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("show_rsvps").insert({ show_id: showId, profile_id: userId });
      setGoing(true);
      setCount((c) => c + 1);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={going}
      className={
        going
          ? "btn-primary disabled:opacity-50"
          : "inline-block border border-white px-6 py-3 text-center lowercase font-bold text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
      }
    >
      {going ? "going ✓" : "i'm going"} · {count}
    </button>
  );
}
