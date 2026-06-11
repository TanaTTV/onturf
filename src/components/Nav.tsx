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
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="wordmark text-xl text-white">
          ONTURF
        </Link>
        <div className="flex items-center gap-4 text-sm lowercase">
          <Link href="/shows" className="text-white hover:text-accent">
            shows
          </Link>
          <Link href="/directory" className="text-white hover:text-accent">
            directory
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-accent">
              admin
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href={username ? `/${username}` : "/onboarding"}
                className="flex items-center gap-2"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="your profile"
                    className="h-7 w-7 rounded-full border border-border object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs text-muted">
                    {(username ?? "?").slice(0, 1)}
                  </span>
                )}
              </Link>
              <Link href="/settings" className="text-muted hover:text-white">
                settings
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/login" className="text-accent">
              log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
