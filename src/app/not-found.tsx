import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-20 text-center">
      <h1 className="wordmark text-6xl text-accent">404</h1>
      <p className="mt-3 lowercase text-muted">nothing on this turf.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/shows" className="btn-accent">
          browse shows
        </Link>
        <Link href="/directory" className="btn-ghost">
          directory
        </Link>
      </div>
    </div>
  );
}
