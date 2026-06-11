"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GENRES, ROLES } from "@/lib/constants";

function Filters() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/directory?${next.toString()}`, { scroll: false });
  }

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if ((params.get("q") ?? "") !== search) setParam("q", search || null);
    }, 350);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <input
        className="input w-full sm:w-56"
        placeholder="search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        className="input w-auto py-2"
        value={params.get("role") ?? ""}
        onChange={(e) => setParam("role", e.target.value || null)}
        aria-label="filter by role"
      >
        <option value="">all roles</option>
        {ROLES.filter((r) => r.value !== "fan").map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <select
        className="input w-auto py-2"
        value={params.get("genre") ?? ""}
        onChange={(e) => setParam("genre", e.target.value || null)}
        aria-label="filter by genre"
      >
        <option value="">all genres</option>
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      {(params.get("role") || params.get("genre") || params.get("q")) && (
        <button
          onClick={() => {
            setSearch("");
            router.replace("/directory", { scroll: false });
          }}
          className="lowercase text-muted underline"
        >
          clear
        </button>
      )}
    </div>
  );
}

export default function DirectoryFilters() {
  return (
    <Suspense>
      <Filters />
    </Suspense>
  );
}
