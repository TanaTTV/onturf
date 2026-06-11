"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ProfileHit = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export default function ProfileSearch({
  placeholder,
  onSelect,
  excludeId,
  selectedLabel,
  onClear,
}: {
  placeholder: string;
  onSelect: (profile: ProfileHit) => void;
  excludeId?: string;
  selectedLabel?: string | null;
  onClear?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ProfileHit[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const q = query.trim().replace(/[%_]/g, "");
      let req = createClient()
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(6);
      if (excludeId) req = req.neq("id", excludeId);
      const { data } = await req;
      setHits((data as ProfileHit[]) ?? []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(timer.current);
  }, [query, excludeId]);

  if (selectedLabel) {
    return (
      <div className="flex items-center justify-between border border-accent bg-surface px-3 py-2.5 text-sm">
        <span className="text-white">{selectedLabel}</span>
        {onClear && (
          <button type="button" onClick={onClear} className="lowercase text-muted">
            change
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && hits.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full border border-border bg-surface">
          {hits.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-background"
                onClick={() => {
                  onSelect(p);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted">
                    {p.display_name.slice(0, 1)}
                  </span>
                )}
                <span className="text-white">{p.display_name}</span>
                <span className="text-muted">@{p.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && hits.length === 0 && query.trim().length >= 2 && (
        <p className="absolute z-10 mt-1 w-full border border-border bg-surface px-3 py-2 text-sm lowercase text-muted">
          no one found — they can sign up at onturf.com
        </p>
      )}
    </div>
  );
}
