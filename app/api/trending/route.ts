import { NextRequest, NextResponse } from "next/server";
import { getTrending, TRENDING_TABS, type TrendingTab } from "../../../lib/trending";

// Tendances AniList pour la Bibliothèque (?tab=saison|prochaine|manga). Cache 6 h.
export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") as TrendingTab | null;
  if (!tab || !TRENDING_TABS.includes(tab)) return NextResponse.json({ error: "Onglet inconnu" }, { status: 400 });
  try {
    return NextResponse.json(await getTrending(tab), { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" } });
  } catch {
    return NextResponse.json({ error: "AniList ne répond pas pour le moment." }, { status: 502 });
  }
}
