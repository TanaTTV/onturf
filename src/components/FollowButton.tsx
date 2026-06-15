"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({
  targetId,
  targetUsername,
  userId,
  initialFollowing,
  initialFollowers,
}: {
  targetId: string;
  targetUsername: string;
  userId: string | null;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);

  if (!userId) {
    return (
      <Link href={`/login?next=/${targetUsername}`} className="btn-text py-1 text-muted">
        follow
      </Link>
    );
  }

  async function toggle() {
    if (!userId || busy) return;
    setBusy(true);
    const supabase = createClient();
    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId)
        .eq("following_id", targetId);
      setFollowing(false);
      setFollowers((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
      setFollowing(true);
      setFollowers((c) => c + 1);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      className="btn-text py-1 disabled:opacity-50"
    >
      {following ? "following ✓" : "follow"}
      {followers > 0 && <span className="text-muted"> · {followers}</span>}
    </button>
  );
}
