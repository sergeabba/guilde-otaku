import { NextResponse } from "next/server";
import { getWeeklyRatings } from "../../../lib/ratings";

// Notes de la semaine (épisodes d'anime), pour la Bibliothèque. Calcul en cache 6 h.
export async function GET() {
  try {
    return NextResponse.json({ ratings: await getWeeklyRatings() }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" } });
  } catch {
    return NextResponse.json({ ratings: [] }, { status: 502 });
  }
}
