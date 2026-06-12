import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function Nav() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let avatarUrl: string | null = null;
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, is_admin")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="wordmark shrink-0 text-base text-white sm:text-lg">
          ONTURF
        </Link>
        <div className="flex items-center gap-3 whitespace-nowrap text-xs lowercase sm:gap-5 sm:text-sm">
          <Link href="/shows" className="text-white hover:underline underline-offset-4">
            shows
          </Link>
          <Link href="/directory" className="text-white hover:underline underline-offset-4">
            directory
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-white hover:underline underline-offset-4"
            >
              <span className="signal-dot" aria-hidden />
              admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/settings" className="text-muted hover:text-white">
                settings
              </Link>
              <LogoutButton />
              <Link
                href={username ? `/${username}` : "/onboarding"}
                className="flex items-center"
                aria-label="your profile"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover grayscale"
                  />
                ) : (
                  <span className="mono-meta-xs flex h-7 w-7 items-center justify-center rounded-full border border-hairline text-muted">
                    {(username ?? "?").slice(0, 1)}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            <Link href="/login" className="text-white hover:underline underline-offset-4">
              log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
