import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-24">
      <h1 className="title-giant -ml-1 text-white">404</h1>
      <p className="mono-meta mt-6 text-muted">NOTHING ON THIS TURF</p>
      <div className="mt-10 flex items-center gap-8">
        <Link href="/shows" className="btn-primary">
          browse shows
        </Link>
        <Link href="/directory" className="btn-text">
          directory
        </Link>
      </div>
    </div>
  );
}
