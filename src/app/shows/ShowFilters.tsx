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
  const hasFilters = genre || allAges || params.get("from") || params.get("to");

  return (
    <div className="flex flex-col gap-4">
      {/* horizontal scrolling text toggles */}
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="flex w-max items-center gap-1">
          <button
            onClick={() => setParam("genre", null)}
            className={`mono-meta min-h-[44px] px-3 transition-colors duration-150 ${
              !genre ? "bg-white text-black" : "text-muted hover:text-white"
            }`}
          >
            all
          </button>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setParam("genre", g === genre ? null : g)}
              className={`mono-meta min-h-[44px] whitespace-nowrap px-3 transition-colors duration-150 ${
                genre === g ? "bg-white text-black" : "text-muted hover:text-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="mono-meta-xs flex items-center gap-2 text-muted">
          from
          <input
            type="date"
            className="input w-auto py-1"
            value={params.get("from") ?? ""}
            onChange={(e) => setParam("from", e.target.value || null)}
          />
        </label>
        <label className="mono-meta-xs flex items-center gap-2 text-muted">
          to
          <input
            type="date"
            className="input w-auto py-1"
            value={params.get("to") ?? ""}
            onChange={(e) => setParam("to", e.target.value || null)}
          />
        </label>
        <button
          onClick={() => setParam("all_ages", allAges ? null : "1")}
          className={`mono-meta min-h-[44px] px-3 transition-colors duration-150 ${
            allAges ? "bg-white text-black" : "text-muted hover:text-white"
          }`}
        >
          all ages
        </button>
        {hasFilters && (
          <button
            onClick={() => router.replace("/shows", { scroll: false })}
            className="btn-text py-0 text-muted"
          >
            clear
          </button>
        )}
      </div>
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
