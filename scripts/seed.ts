/**
 * ONTURF seed script — sample venues, profiles, and shows for development.
 *
 * All sample data is tagged: usernames start with "smpl", venues/shows titles
 * are real-ish but seeded emails live under @sample.onturf.com.
 *
 *   npm run seed          # insert sample data
 *   npm run seed:wipe     # remove all sample data
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (server/scripts only).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SAMPLE_EMAIL_DOMAIN = "sample.onturf.com";

const VENUES = [
  { name: "Launchpad", address: "618 Central Ave SW", all_ages: false },
  { name: "Sunshine Theater", address: "120 Central Ave SW", all_ages: true },
  { name: "Moonlight Lounge", address: "120 Central Ave SW", all_ages: false },
  { name: "The Jam Spot", address: "2700 2nd St NW", all_ages: true },
  { name: "Revel", address: "4720 Alexander Blvd NE", all_ages: false },
  { name: "Sister Bar", address: "407 Central Ave NW", all_ages: false },
  { name: "Insideout", address: "622 Central Ave SW", all_ages: false },
  { name: "El Rey Theater", address: "622 Central Ave SW", all_ages: true },
  { name: "Tortuga Gallery", address: "901 Edith Blvd SE", all_ages: true },
  { name: "Marble Brewery", address: "111 Marble Ave NW", all_ages: false },
];

type SeedProfile = {
  username: string;
  display_name: string;
  roles: string[];
  genres: string[];
  bio: string;
  open_to_work?: boolean;
};

const PROFILES: SeedProfile[] = [
  { username: "smpl.cruces", display_name: "Cruces", roles: ["artist"], genres: ["hip-hop", "rap"], bio: "westside rapper. sample profile." },
  { username: "smpl.novabeats", display_name: "Nova Beats", roles: ["producer"], genres: ["hip-hop", "electronic"], bio: "beats for days. sample profile.", open_to_work: true },
  { username: "smpl.lapaloma", display_name: "La Paloma", roles: ["artist"], genres: ["latin", "indie"], bio: "bilingual indie. sample profile." },
  { username: "smpl.staticfuzz", display_name: "Static Fuzz", roles: ["artist"], genres: ["punk", "hardcore"], bio: "loud and fast. sample profile." },
  { username: "smpl.mixmaster_j", display_name: "Mixmaster J", roles: ["engineer"], genres: ["hip-hop", "r&b"], bio: "mix + master. sample profile.", open_to_work: true },
  { username: "smpl.desertvisions", display_name: "Desert Visions", roles: ["videographer"], genres: ["hip-hop"], bio: "music videos. sample profile.", open_to_work: true },
  { username: "smpl.inkbyrd", display_name: "Inkbyrd", roles: ["designer"], genres: [], bio: "flyers + cover art. sample profile.", open_to_work: true },
  { username: "smpl.dukecityduo", display_name: "Duke City Duo", roles: ["artist"], genres: ["folk", "country"], bio: "two voices. sample profile." },
  { username: "smpl.bassqueen", display_name: "Bass Queen", roles: ["artist", "producer"], genres: ["electronic", "house"], bio: "late night sets. sample profile." },
  { username: "smpl.elcoyote", display_name: "El Coyote", roles: ["artist"], genres: ["rap", "latin"], bio: "505 till i die. sample profile." },
  { username: "smpl.glasshalf", display_name: "Glass Half", roles: ["artist"], genres: ["indie", "rock"], bio: "shoegaze adjacent. sample profile." },
  { username: "smpl.hexvoid", display_name: "Hexvoid", roles: ["artist"], genres: ["metal", "experimental"], bio: "doom from the mesa. sample profile." },
  { username: "smpl.smoothkeys", display_name: "Smooth Keys", roles: ["artist", "producer"], genres: ["jazz", "soul"], bio: "keys for hire. sample profile.", open_to_work: true },
  { username: "smpl.theplug", display_name: "The Plug ABQ", roles: ["venue_promoter"], genres: ["hip-hop"], bio: "diy shows monthly. sample profile." },
  { username: "smpl.softstatic", display_name: "Soft Static", roles: ["artist"], genres: ["electronic", "experimental"], bio: "ambient sets. sample profile." },
  { username: "smpl.reina", display_name: "Reina", roles: ["artist"], genres: ["r&b", "pop"], bio: "vocals. sample profile." },
  { username: "smpl.fastlane", display_name: "Fastlane", roles: ["artist"], genres: ["punk", "rock"], bio: "garage rock. sample profile." },
  { username: "smpl.404films", display_name: "404 Films", roles: ["videographer", "designer"], genres: [], bio: "visuals. sample profile.", open_to_work: true },
  { username: "smpl.lowdesert", display_name: "Low Desert", roles: ["artist"], genres: ["indie", "folk"], bio: "quiet songs. sample profile." },
  { username: "smpl.knockbeats", display_name: "Knock Beats", roles: ["producer", "engineer"], genres: ["hip-hop", "rap"], bio: "drums knock. sample profile.", open_to_work: true },
];

const SHOW_TITLES = [
  "505 Cypher Night",
  "Desert Punk Fest",
  "Low End Theory ABQ",
  "Friday Night DIY",
  "Burque Beats Showcase",
  "Mesa Doom Ritual",
  "Indie Night at the Theater",
  "Latin Underground",
  "House Heads Unite",
  "Folk on the Patio",
  "Hardcore Matinee",
  "R&B Slow Jams Live",
  "Experimental Sound Series",
  "Hip-Hop Open Mic",
  "End of Month Rager",
];

async function wipe() {
  console.log("wiping sample data…");
  const { data: sampleProfiles } = await db
    .from("profiles")
    .select("id, username")
    .like("username", "smpl.%");
  for (const p of sampleProfiles ?? []) {
    await db.auth.admin.deleteUser(p.id); // cascades to profile + credits + embeds + lineup
  }
  // sample shows are the ones submitted by sample profiles (now null) — match by title
  await db.from("shows").delete().in("title", SHOW_TITLES);
  await db.from("venues").delete().in("name", VENUES.map((v) => v.name));
  console.log(`removed ${sampleProfiles?.length ?? 0} profiles, sample shows + venues.`);
}

async function seed() {
  console.log("seeding venues…");
  const { data: venues, error: venueErr } = await db
    .from("venues")
    .insert(VENUES.map((v) => ({ ...v, city: "albuquerque" })))
    .select("id, name, all_ages");
  if (venueErr) throw venueErr;

  console.log("seeding profiles (auth users + profile rows)…");
  const profileIds: { id: string; username: string; genres: string[] }[] = [];
  for (const p of PROFILES) {
    const email = `${p.username.replace(/\./g, "-")}@${SAMPLE_EMAIL_DOMAIN}`;
    const { data: created, error: userErr } = await db.auth.admin.createUser({
      email,
      password: crypto.randomUUID(),
      email_confirm: true,
    });
    if (userErr) throw userErr;
    const { error: profErr } = await db.from("profiles").insert({
      id: created.user.id,
      username: p.username,
      display_name: p.display_name,
      roles: p.roles,
      genres: p.genres,
      bio: p.bio,
      open_to_work: p.open_to_work ?? false,
    });
    if (profErr) throw profErr;
    profileIds.push({ id: created.user.id, username: p.username, genres: p.genres });
  }

  console.log("seeding shows over the next 30 days…");
  const artists = profileIds.filter((_, i) => PROFILES[i].roles.includes("artist"));
  const showRows = SHOW_TITLES.map((title, i) => {
    const venue = venues![i % venues!.length];
    const daysOut = 2 + i * 2; // spread over ~30 days
    const start = new Date();
    start.setDate(start.getDate() + daysOut);
    start.setHours(19 + (i % 3), 30, 0, 0);
    const genrePool = ["hip-hop", "punk", "electronic", "indie", "latin", "metal", "folk", "r&b"];
    return {
      title,
      venue_id: venue.id,
      city: "albuquerque",
      starts_at: start.toISOString(),
      price_text: i % 3 === 0 ? "free" : i % 3 === 1 ? "$10" : "$10 adv / $15 door",
      all_ages: venue.all_ages,
      genres: [genrePool[i % genrePool.length], genrePool[(i + 3) % genrePool.length]],
      description: "sample show seeded for development.",
      status: "approved" as const,
      submitted_by: profileIds[i % profileIds.length].id,
    };
  });
  const { data: shows, error: showErr } = await db
    .from("shows")
    .insert(showRows)
    .select("id");
  if (showErr) throw showErr;

  console.log("tagging lineups…");
  const lineupRows = shows!.flatMap((show, i) => {
    const a = artists[i % artists.length];
    const b = artists[(i + 1) % artists.length];
    const c = artists[(i + 2) % artists.length];
    return [
      { show_id: show.id, profile_id: a.id, billing_order: 0 },
      { show_id: show.id, profile_id: b.id, billing_order: 1 },
      { show_id: show.id, profile_id: c.id, billing_order: 2 },
    ];
  });
  const { error: lineupErr } = await db.from("show_lineup").insert(lineupRows);
  if (lineupErr) throw lineupErr;

  console.log(
    `done: ${venues!.length} venues, ${profileIds.length} profiles, ${shows!.length} shows.`
  );
}

const cmd = process.argv[2];
(cmd === "wipe" ? wipe() : seed()).catch((e) => {
  console.error(e);
  process.exit(1);
});
