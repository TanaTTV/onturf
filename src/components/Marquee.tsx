// effects budget item #3: one slow marquee strip, max
export default function Marquee({ text }: { text: string }) {
  const segment = `${text} — `;
  return (
    <div className="marquee border-y border-hairline py-2" aria-hidden>
      <div className="mono-meta text-muted">
        {segment.repeat(6)}
        {segment.repeat(6)}
      </div>
    </div>
  );
}
