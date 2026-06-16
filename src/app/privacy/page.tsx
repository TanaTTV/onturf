import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "privacy",
  description: `How ${SITE_NAME} handles your data.`,
};

const UPDATED = "June 2026";
const CONTACT = "hello@onturf.com"; // TODO: replace with your real contact address

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl pt-10 sm:pt-14">
      <h1 className="wordmark text-5xl text-white sm:text-6xl">privacy</h1>
      <p className="mono-meta mt-4 text-muted">LAST UPDATED — {UPDATED}</p>

      <div className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-white">
        <p>
          {SITE_NAME} is a community platform for the Albuquerque music scene. We
          keep data collection to what the app needs to work. This page explains
          what we store and why.
        </p>

        <section>
          <h2 className="mono-meta mb-2 text-white">WHAT WE COLLECT</h2>
          <ul className="list-disc space-y-1 pl-5 text-muted">
            <li>
              <span className="text-white">Account</span> — your email address and
              login credentials (or Google account, if you use Google sign-in).
            </li>
            <li>
              <span className="text-white">Profile</span> — anything you choose to
              add: display name, username, bio, avatar, genres, links, embeds, and
              credits.
            </li>
            <li>
              <span className="text-white">Activity</span> — shows you submit or
              RSVP to, artists you follow, and feedback you send.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mono-meta mb-2 text-white">HOW WE USE IT</h2>
          <p className="text-muted">
            To run the platform — show your public profile and link page, power the
            show calendar and directory, deliver RSVPs and follows, and let admins
            moderate content. Your profile, shows, and link page are public by
            design. Your email and feedback are not shown publicly.
          </p>
        </section>

        <section>
          <h2 className="mono-meta mb-2 text-white">WHO WE SHARE IT WITH</h2>
          <p className="text-muted">
            We don&apos;t sell your data. We rely on a few infrastructure providers
            to operate: <span className="text-white">Supabase</span> (database,
            auth, file storage), <span className="text-white">Google</span> (only
            if you choose Google sign-in), and{" "}
            <span className="text-white">Cloudflare</span> (hosting). Media you
            upload (avatars, flyers) is stored in public buckets so it can be shown
            on the site.
          </p>
        </section>

        <section>
          <h2 className="mono-meta mb-2 text-white">COOKIES</h2>
          <p className="text-muted">
            We use a session cookie to keep you signed in. That&apos;s it — no
            third-party advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="mono-meta mb-2 text-white">YOUR CONTROL</h2>
          <p className="text-muted">
            You can edit or remove your profile details anytime in settings.
            Deleting your account (settings → account) removes your profile and
            associated data. Shows you submitted may remain on the calendar with
            your name detached.
          </p>
        </section>

        <section>
          <h2 className="mono-meta mb-2 text-white">CONTACT</h2>
          <p className="text-muted">
            Questions about your data? Use the in-app feedback button or email{" "}
            <a
              href={`mailto:${CONTACT}`}
              className="text-white underline underline-offset-4"
            >
              {CONTACT}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
