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

  const role = params.get("role") ?? "";
  const genre = params.get("genre") ?? "";

  return (
    <div className="flex flex-col gap-4">
      <input
        className="input max-w-sm"
        placeholder="search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* roles — horizontal text toggles */}
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="flex w-max items-center gap-1">
          {ROLES.filter((r) => r.value !== "fan").map((r) => (
            <button
              key={r.value}
              onClick={() => setParam("role", r.value === role ? null : r.value)}
              className={`mono-meta min-h-[44px] whitespace-nowrap px-3 transition-colors duration-150 ${
                role === r.value ? "bg-white text-black" : "text-muted hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* genres — horizontal text toggles */}
      <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
        <div className="flex w-max items-center gap-1">
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

      {(role || genre || params.get("q")) && (
        <button
          onClick={() => {
            setSearch("");
            router.replace("/directory", { scroll: false });
          }}
          className="btn-text self-start py-0 text-muted"
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
