import Link from "next/link";
import type { ShowWithVenue } from "@/lib/types";
import { formatShowDate, formatShowTime, venueLabel } from "@/lib/utils";

/** Ledger row: mono date block like a catalog number, title in bold body, meta in mono caps. */
export default function ShowRow({ show }: { show: ShowWithVenue }) {
  const isTonight =
    new Date(show.starts_at).toDateString() === new Date().toDateString();

  return (
    <Link
      href={`/shows/${show.id}`}
      className="row-hover grid min-h-[44px] grid-cols-[64px_1fr] items-center gap-x-4 gap-y-1 border-t border-hairline py-3 sm:grid-cols-[110px_56px_1fr_auto] sm:gap-x-6"
    >
      <div className="mono-meta-xs col-start-1 row-span-2 text-muted sm:row-span-1">
        {formatShowDate(show.starts_at)}
        <br />
        {formatShowTime(show.starts_at)}
        {isTonight && (
          <span className="mt-1 flex items-center gap-1.5 text-white">
            <span className="signal-dot" aria-hidden />
            tonight
          </span>
        )}
      </div>

      {show.flyer_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={show.flyer_url}
          alt=""
          className="hidden h-14 w-14 object-cover sm:block"
          loading="lazy"
        />
      ) : (
        <div className="hidden h-14 w-14 border border-hairline sm:block" aria-hidden />
      )}

      <div className="min-w-0">
        <h3 className="truncate font-bold text-white">{show.title}</h3>
        <p className="mono-meta-xs mt-0.5 truncate text-muted">
          {venueLabel(show)}
          {show.genres.length > 0 && ` — ${show.genres.slice(0, 3).join(" / ")}`}
        </p>
      </div>

      <div className="mono-meta-xs col-start-2 text-muted sm:col-start-4 sm:text-right">
        {show.price_text ?? ""}
        {show.all_ages && (
          <span className="text-white">{show.price_text ? " — " : ""}all ages</span>
        )}
      </div>
    </Link>
  );
}
