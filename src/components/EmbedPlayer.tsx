import { toEmbedSrc } from "@/lib/utils";

export default function EmbedPlayer({ url }: { url: string }) {
  const embed = toEmbedSrc(url);
  if (!embed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block truncate border border-hairline p-3 text-sm text-white"
      >
        {url} ↗
      </a>
    );
  }
  return (
    <iframe
      src={embed.src}
      height={embed.height}
      className="w-full border-0"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
    />
  );
}
