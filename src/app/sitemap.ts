import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL } from "@/lib/constants";

export const runtime = "edge";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shows`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/directory`, changeFrequency: "daily", priority: 0.9 },
  ];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [{ data: shows }, { data: profiles }] = await Promise.all([
      supabase
        .from("shows")
        .select("id, created_at")
        .eq("status", "approved")
        .gte("starts_at", new Date().toISOString())
        .limit(500),
      supabase.from("profiles").select("username, updated_at").limit(1000),
    ]);

    return [
      ...staticPages,
      ...(shows ?? []).map((s) => ({
        url: `${SITE_URL}/shows/${s.id}`,
        lastModified: s.created_at,
        priority: 0.7,
      })),
      ...(profiles ?? []).map((p) => ({
        url: `${SITE_URL}/${p.username}`,
        lastModified: p.updated_at,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticPages;
  }
}
