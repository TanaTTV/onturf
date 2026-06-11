"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConfirmCreditButton({ creditId }: { creditId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    await createClient().from("credits").update({ confirmed: true }).eq("id", creditId);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={confirm}
      disabled={busy}
      className="ml-2 lowercase text-accent underline disabled:opacity-50"
    >
      {busy ? "…" : "confirm"}
    </button>
  );
}
