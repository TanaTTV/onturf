import type { ShowWithVenue } from "./types";

export function formatShowDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Denver",
  });
}

export function formatShowTime(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Denver",
    })
    .toLowerCase();
}

export function venueLabel(show: ShowWithVenue): string {
  return show.venues?.name ?? show.venue_name_freetext ?? "venue tba";
}

/** Convert a raw spotify/soundcloud/youtube URL into an iframe embed src, or null if unsupported. */
export function toEmbedSrc(raw: string): { src: string; height: number } | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "open.spotify.com" || host === "spotify.com") {
      // /track/<id>, /album/<id>, /playlist/<id>, /artist/<id>
      const m = url.pathname.match(/\/(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/);
      if (!m) return null;
      return {
        src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`,
        height: m[1] === "track" || m[1] === "episode" ? 152 : 352,
      };
    }

    if (host === "soundcloud.com" || host === "on.soundcloud.com") {
      return {
        src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&color=%23ff3b1f&auto_play=false&show_comments=false`,
        height: 166,
      };
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
      let id: string | null = null;
      if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
      else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
      else id = url.searchParams.get("v");
      if (!id) return null;
      return { src: `https://www.youtube-nocookie.com/embed/${id}`, height: 215 };
    }

    return null;
  } catch {
    return null;
  }
}

/** Client-side: downscale an image file to fit maxDim and return a webp blob under ~2MB. */
export async function resizeImage(file: File, maxDim = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85)
  );
  if (!blob) throw new Error("image processing failed");
  return blob;
}

/** datetime-local input value -> ISO string (treats input as local time). */
export function localInputToISO(value: string): string {
  return new Date(value).toISOString();
}
