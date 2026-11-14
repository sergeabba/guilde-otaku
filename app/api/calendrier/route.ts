import { NextResponse } from "next/server";
import { getAiringWeek } from "../../../lib/airing";

// Index léger des séries de la semaine (recherche globale).
export async function GET() {
  try {
    const seen = new Set<number>();
    const series = (await getAiringWeek()).filter((e) => !seen.has(e.mediaId) && seen.add(e.mediaId))
      .map((e) => ({ id: e.mediaId, title: e.title, alt: e.titleAlt, cover: e.cover, at: e.at, episode: e.episode, fans: e.followers.length }));
    return NextResponse.json({ series }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ series: [] }, { status: 502 });
  }
}
