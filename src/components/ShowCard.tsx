import Link from "next/link";
import type { ShowWithVenue } from "@/lib/types";
import { formatShowDate, formatShowTime, venueLabel } from "@/lib/utils";

export default function ShowCard({ show }: { show: ShowWithVenue }) {
  return (
    <Link
      href={`/shows/${show.id}`}
      className="flex gap-3 border border-border bg-surface p-3 transition-colors hover:border-accent"
    >
      {show.flyer_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={show.flyer_url}
          alt={`${show.title} flyer`}
          className="h-24 w-20 shrink-0 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-24 w-20 shrink-0 items-center justify-center border border-border text-xs lowercase text-muted">
          no flyer
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs lowercase text-accent">
          {formatShowDate(show.starts_at)} · {formatShowTime(show.starts_at)}
        </p>
        <h3 className="truncate font-bold text-white">{show.title}</h3>
        <p className="truncate text-sm lowercase text-muted">{venueLabel(show)}</p>
        <p className="mt-1 flex flex-wrap gap-1 text-xs lowercase text-muted">
          {show.price_text && <span>{show.price_text}</span>}
          {show.all_ages && <span className="text-white">· all ages</span>}
          {show.genres.slice(0, 3).map((g) => (
            <span key={g} className="chip">
              {g}
            </span>
          ))}
        </p>
      </div>
    </Link>
  );
}
