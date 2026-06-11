"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { GENRES } from "@/lib/constants";

function Filters() {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/shows?${next.toString()}`, { scroll: false });
  }

  const genre = params.get("genre") ?? "";
  const allAges = params.get("all_ages") === "1";

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <select
        className="input w-auto py-2"
        value={genre}
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

      <input
        type="date"
        className="input w-auto py-2"
        value={params.get("from") ?? ""}
        onChange={(e) => setParam("from", e.target.value || null)}
        aria-label="from date"
      />
      <input
        type="date"
        className="input w-auto py-2"
        value={params.get("to") ?? ""}
        onChange={(e) => setParam("to", e.target.value || null)}
        aria-label="to date"
      />

      <button
        onClick={() => setParam("all_ages", allAges ? null : "1")}
        className={`border px-3 py-2 lowercase ${
          allAges ? "border-accent text-accent" : "border-border text-white"
        }`}
      >
        all ages
      </button>

      {(genre || allAges || params.get("from") || params.get("to")) && (
        <button
          onClick={() => router.replace("/shows", { scroll: false })}
          className="lowercase text-muted underline"
        >
          clear
        </button>
      )}
    </div>
  );
}

export default function ShowFilters() {
  return (
    <Suspense>
      <Filters />
    </Suspense>
  );
}
