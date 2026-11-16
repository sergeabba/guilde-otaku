import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getServiceClient } from "../../../lib/supabase-admin";
import { toPublic, type NewsRow } from "../../../lib/news";

const NEWS_TAG = "news";

// Actualités publiées (relues par l'admin), les plus récentes d'abord.
const published = unstable_cache(async () => {
  const db = getServiceClient();
  if (!db) return [];
  const { data, error } = await db.from("news_items").select("*").eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(24);
  if (error) throw new Error(error.message);
  return ((data ?? []) as NewsRow[]).map(toPublic);
}, ["news-published-v1"], { revalidate: 600, tags: [NEWS_TAG] });

export async function GET() {
  try {
    return NextResponse.json({ news: await published() }, { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" } });
  } catch {
    // Table absente (migration non lancée) ou base indisponible : section masquée.
    return NextResponse.json({ news: [] });
  }
}
